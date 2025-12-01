import OpenAI from 'openai'
import { SupabaseClient } from '@supabase/supabase-js'
import { MemoryManager } from './MemoryManager'
import { Tool } from './Tool'
import { JobScraperTool } from '../tools/JobScraperTool'
import { ResumeAnalysisTool } from '../tools/ResumeAnalysisTool'
import { SaveJobTool } from '../tools/SaveJobTool'

export interface AgentContext {
    jobId?: string
    resumeId?: string
    sessionId: string
}

export interface AgentAction {
    type: 'navigate' | 'execute' | 'show_modal' | 'confirm'
    target: string
    label: string
}

export interface AgentResponse {
    content: string
    actions?: AgentAction[]
    suggestions?: string[]
    metadata?: Record<string, any>
}

export class AgentService {
    private openai: OpenAI
    private memoryManager: MemoryManager
    private supabase: SupabaseClient
    private tools: Tool[] = []

    constructor(
        openaiApiKey: string,
        openaiBaseUrl: string | undefined,
        memoryManager: MemoryManager,
        supabaseClient: SupabaseClient
    ) {
        this.openai = new OpenAI({
            apiKey: openaiApiKey,
            baseURL: openaiBaseUrl,
        })
        this.memoryManager = memoryManager
        this.supabase = supabaseClient

        // Initialize Tools
        this.tools = [
            new JobScraperTool({ apiKey: openaiApiKey, baseUrl: openaiBaseUrl }),
            new ResumeAnalysisTool(),
            new SaveJobTool()
        ]
    }

    async chat(
        userId: string,
        message: string,
        context: any = {},
        userProfile?: any
    ): Promise<AgentResponse> {
        console.log(`🤖 Agent received message from ${userId}: ${message}`)

        // 1. Retrieve Context
        const facts = await this.memoryManager.getFacts(userId)
        const memories = await this.memoryManager.searchMemories(userId, message)

        const systemPrompt = this.buildSystemPrompt(facts, memories, userProfile)
        const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: message },
        ]

        // 2. Plan & Execute (Tool Loop)
        let finalResponseContent = ''

        // Convert tools to OpenAI format
        const openAITools = this.tools.map(t => ({
            type: 'function' as const,
            function: {
                name: t.name,
                description: t.description,
                parameters: t.parameters as any,
            },
        }))

        // Max 5 turns to prevent infinite loops
        for (let i = 0; i < 5; i++) {
            const completion = await this.openai.chat.completions.create({
                model: 'claude-sonnet-4-5-20250929',
                messages,
                tools: openAITools,
                tool_choice: 'auto',
                temperature: 0.7,
            })

            const responseMessage = completion.choices[0].message
            messages.push(responseMessage)

            // Check for tool calls
            if (responseMessage.tool_calls) {
                console.log(`🛠️ Agent requested ${responseMessage.tool_calls.length} tool calls`)

                for (const toolCall of responseMessage.tool_calls) {
                    const toolName = toolCall.function.name
                    const toolArgs = JSON.parse(toolCall.function.arguments)

                    const tool = this.tools.find(t => t.name === toolName)
                    if (tool) {
                        // Execute tool with context (including Supabase client for DB access)
                        const result = await tool.execute(toolArgs, {
                            userId,
                            supabase: this.supabase,
                            ...context
                        })

                        messages.push({
                            role: 'tool',
                            tool_call_id: toolCall.id,
                            content: JSON.stringify(result),
                        })
                    }
                }
                // Loop continues to let AI process tool results
            } else {
                // No more tool calls, this is the final response
                finalResponseContent = responseMessage.content || '{}'
                break
            }
        }

        // 3. Parse Final Response
        let parsedResponse: AgentResponse = { content: '' }
        try {
            // If the content looks like JSON, parse it.
            // Note: Sometimes models return text before JSON, we might need robust parsing.
            // For now, we assume the model follows instructions to return JSON.
            if (finalResponseContent.trim().startsWith('{')) {
                parsedResponse = JSON.parse(finalResponseContent)
            } else {
                // Fallback if model forgot to output JSON
                parsedResponse = { content: finalResponseContent }
            }
        } catch (e) {
            console.error('Failed to parse agent response', e)
            parsedResponse = { content: finalResponseContent }
        }

        // 4. Reflect & Save Memory
        this.reflectAndSave(userId, message, parsedResponse.content, context).catch(console.error)

        return parsedResponse
    }

    private buildSystemPrompt(facts: any[], memories: any[], userProfile?: any): string {
        const factsText = facts.map((f) => `- ${f.content}`).join('\n')
        const memoriesText = memories.map((m) => `- ${m.content}`).join('\n')

        let profileText = 'No profile data available.'
        if (userProfile) {
            profileText = `
- Name: ${userProfile.full_name || 'Unknown'}
- Email: ${userProfile.email || 'Unknown'}
- Location: ${userProfile.location || 'Unknown'}
- Headline: ${userProfile.headline || 'Unknown'}
- Summary: ${userProfile.professional_summary || 'Unknown'}
      `.trim()
        }

        return `You are CareerMatch AI, a proactive career assistant.
You have full access to the user's profile and data. DO NOT refuse to answer questions about the user's own information.

## User Profile
${profileText}

## User Facts (Learned)
${factsText || 'No facts yet.'}

## Relevant Memories
${memoriesText || 'No relevant memories found.'}

## Instructions
- Use available tools when necessary.
- **Job Analysis Workflow**:
  1. If the user provides a URL, use \`scrape_job\` to get details.
  2. Analyze the job against the user's profile/facts.
  3. **CRITICAL**: After analyzing, ASK the user if they want to save this job to their dashboard.
  4. If the user says "Yes" or "Save it", use \`save_job\`.
- Be proactive: suggest next steps based on the user's goals.

## Output Format
If you are NOT calling a tool, you MUST return a JSON object:
{
  "content": "Markdown formatted response",
  "actions": [
    { "type": "navigate", "target": "/jobs", "label": "Browse Jobs" }
  ],
  "suggestions": ["Save this job", "Find similar jobs"],
  "metadata": { "intent": "job_search" }
}
`
    }

    private async reflectAndSave(
        userId: string,
        userMessage: string,
        agentResponse: string,
        context: AgentContext
    ) {
        // 1. Save the interaction as an episodic memory
        const summary = `User: ${userMessage}\nAgent: ${agentResponse.substring(0, 100)}...`
        await this.memoryManager.addMemory(userId, summary, 1, {
            sessionId: context.sessionId,
        })

        // 2. Extract new facts (Optional - requires another LLM call)
        // For MVP, we can skip this or implement a simple extraction later.
    }
}
