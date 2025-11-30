import OpenAI from 'openai'
import { MemoryManager } from './MemoryManager'

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

    constructor(
        openaiApiKey: string,
        openaiBaseUrl: string | undefined,
        memoryManager: MemoryManager
    ) {
        this.openai = new OpenAI({
            apiKey: openaiApiKey,
            baseURL: openaiBaseUrl,
        })
        this.memoryManager = memoryManager
    }

    async chat(
        userId: string,
        message: string,
        context: AgentContext
    ): Promise<AgentResponse> {
        // 1. Retrieve Context (Facts & Memories)
        const facts = await this.memoryManager.getFacts(userId)
        const memories = await this.memoryManager.searchMemories(userId, message)

        const systemPrompt = this.buildSystemPrompt(facts, memories)

        // 2. Plan & Generate Response
        const completion = await this.openai.chat.completions.create({
            model: 'claude-sonnet-4-5-20250929',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: message },
            ],
            temperature: 0.7,
            response_format: { type: 'json_object' } // Force JSON output
        })

        const responseContent = completion.choices[0]?.message?.content || '{}'
        let parsedResponse: AgentResponse = { content: '' }

        try {
            parsedResponse = JSON.parse(responseContent)
        } catch (e) {
            console.error('Failed to parse agent response', e)
            parsedResponse = { content: responseContent }
        }

        // 3. Reflect & Save Memory (Async)
        this.reflectAndSave(userId, message, parsedResponse.content, context).catch(console.error)

        return parsedResponse
    }

    private buildSystemPrompt(facts: any[], memories: any[]): string {
        const factsText = facts.map((f) => `- ${f.content}`).join('\n')
        const memoriesText = memories.map((m) => `- ${m.content}`).join('\n')

        return `You are CareerMatch AI, a proactive career assistant.

## User Facts (What we know about the user)
${factsText || 'No facts yet.'}

## Relevant Memories (Context from past conversations)
${memoriesText || 'No relevant memories found.'}

## Instructions
- Use the facts and memories to provide personalized advice.
- Be proactive: suggest next steps based on the user's goals.
- If you learn something new and important about the user, mention it so I can save it.

## Output Format
You must return a JSON object with the following structure:
{
  "content": "Markdown formatted response",
  "actions": [
    { "type": "navigate", "target": "/jobs", "label": "Browse Jobs" }
  ],
  "suggestions": ["Next question 1", "Next question 2"],
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
