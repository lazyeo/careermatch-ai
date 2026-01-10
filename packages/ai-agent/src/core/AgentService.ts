import Anthropic from '@anthropic-ai/sdk'
import { SupabaseClient } from '@supabase/supabase-js'
import { MemoryManager } from './MemoryManager'
import { Tool } from './Tool'
import { JobScraperTool } from '../tools/JobScraperTool'
import { ResumeAnalysisTool } from '../tools/ResumeAnalysisTool'
import { SaveJobTool } from '../tools/SaveJobTool'
import { BatchJobImportTool } from '../tools/BatchJobImportTool'

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
    private client: Anthropic
    private memoryManager: MemoryManager
    private supabase: SupabaseClient
    private tools: Tool[] = []

    constructor(
        apiKey: string,
        memoryManager: MemoryManager,
        supabaseClient: SupabaseClient
    ) {
        this.client = new Anthropic({
            apiKey: apiKey,
        })
        this.memoryManager = memoryManager
        this.supabase = supabaseClient

        // Initialize Tools
        // Note: For scraper tools, we can reuse the Anthropic API key since we updated them to use it
        this.tools = [
            new JobScraperTool({ apiKey }),
            new BatchJobImportTool({ apiKey }),
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

        let messages: Anthropic.MessageParam[] = [
            { role: 'user', content: message }
        ]

        // 2. Plan & Execute (Tool Loop)
        let finalResponseContent = ''

        // Convert tools to Anthropic format
        const anthropicTools: Anthropic.Tool[] = this.tools.map(t => ({
            name: t.name,
            description: t.description,
            input_schema: t.parameters as Anthropic.Tool.InputSchema,
        }))

        // Max 5 turns to prevent infinite loops
        for (let i = 0; i < 5; i++) {
            const response = await this.client.messages.create({
                model: 'claude-3-5-sonnet-20241022',
                max_tokens: 4096,
                system: systemPrompt,
                messages,
                tools: anthropicTools,
            })

            // Add assistant response to history
            messages.push({
                role: 'assistant',
                content: response.content,
            })

            // Check for tool calls
            const toolUseBlocks = response.content.filter(block => block.type === 'tool_use') as Anthropic.ToolUseBlock[]

            if (toolUseBlocks.length > 0) {
                console.log(`🛠️ Agent requested ${toolUseBlocks.length} tool calls`)

                const toolResults: Anthropic.ToolResultBlockParam[] = []

                for (const toolUse of toolUseBlocks) {
                    const toolName = toolUse.name
                    const toolArgs = toolUse.input

                    const tool = this.tools.find(t => t.name === toolName)
                    try {
                        if (tool) {
                            // Execute tool with context
                            const result = await tool.execute(toolArgs, {
                                userId,
                                supabase: this.supabase,
                                ...context
                            })

                            toolResults.push({
                                type: 'tool_result',
                                tool_use_id: toolUse.id,
                                content: typeof result === 'string' ? result : JSON.stringify(result),
                            })
                        } else {
                            toolResults.push({
                                type: 'tool_result',
                                tool_use_id: toolUse.id,
                                content: `Error: Tool ${toolName} not found`,
                                is_error: true,
                            })
                        }
                    } catch (error: any) {
                        toolResults.push({
                            type: 'tool_result',
                            tool_use_id: toolUse.id,
                            content: `Error executing tool ${toolName}: ${error.message}`,
                            is_error: true,
                        })
                    }
                }

                // Add tool results to history
                messages.push({
                    role: 'user',
                    content: toolResults,
                })

                // Loop continues to let AI process tool results
            } else {
                // No more tool calls, this is the final response
                // Find the first text block
                const textBlock = response.content.find(block => block.type === 'text') as Anthropic.TextBlock
                finalResponseContent = textBlock?.text || ''
                break
            }
        }

        // 3. Parse Final Response
        let parsedResponse: AgentResponse = { content: '' }
        try {
            // If the content looks like JSON, parse it.
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
- **Tool Usage**: You have a tool \`batch_import_jobs\` that can access and read any job URL. **YOU CAN ACCESS LINKS**. Do not say you cannot.
- **Multiple URLs**: If the user provides multiple job URLs (e.g. "analyze these: url1, url2"), you **MUST** call \`batch_import_jobs\` with the list of URLs.
  - Do not ask for permission.
  - Do not say you need to visit them.
  - Just call the tool.
  - Once the tool returns the job details, you can then proceed to analyze them.
- **Single URL**:
  - If the user asks to *import* or *save*, call \`batch_import_jobs\`.
  - If the user asks to *analyze*, call \`scrape_job\` (or \`batch_import_jobs\`), get the content, and then analyze.
- **Proactive**: Suggest next steps based on the user's goals.

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
