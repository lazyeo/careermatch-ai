import { Tool } from '../core/Tool'
import { parseResumeContent } from '@careermatch/resume-parser'

export class ResumeAnalysisTool implements Tool {
    name = 'analyze_resume'
    description = 'Analyze a resume text content to extract structured information like skills, experience, and education.'

    parameters = {
        type: 'object' as const,
        properties: {
            content: {
                type: 'string',
                description: 'The full text content of the resume to analyze',
            },
        },
        required: ['content'],
    }

    async execute(args: { content: string }) {
        try {
            console.log(`🛠️ Tool Execution: analyze_resume (length: ${args.content.length})`)
            const result = await parseResumeContent(args.content)

            return {
                success: true,
                data: result
            }
        } catch (error) {
            return {
                success: false,
                error: (error as Error).message
            }
        }
    }
}
