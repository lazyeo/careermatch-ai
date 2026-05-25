import { Tool } from '../core/Tool'
import { SupabaseClient } from '@supabase/supabase-js'
import { tasks } from '@trigger.dev/sdk/v3'
import { enqueueAutomaticJobAnalysis } from '@careermatch/shared'

export class SaveJobTool implements Tool {
    name = 'save_job'
    description = 'Save a job posting to the database. Use this when the user explicitly confirms they want to save a job, or asks to "save this".'

    parameters = {
        type: 'object' as const,
        properties: {
            title: { type: 'string', description: 'Job title' },
            company: { type: 'string', description: 'Company name' },
            location: { type: 'string', description: 'Job location' },
            description: { type: 'string', description: 'Full job description' },
            salary_min: { type: 'number', description: 'Minimum salary' },
            salary_max: { type: 'number', description: 'Maximum salary' },
            source_url: { type: 'string', description: 'URL of the job posting' },
            job_type: { type: 'string', description: 'Type of job (full-time, contract, etc.)' }
        },
        required: ['title', 'company'],
    }

    async execute(args: any, context: { supabase: SupabaseClient; userId: string }) {
        try {
            console.log(`🛠️ Tool Execution: save_job for "${args.title}" at "${args.company}"`)

            if (!context.supabase || !context.userId) {
                throw new Error('Database context not available')
            }

            const { data, error } = await context.supabase
                .from('jobs')
                .insert({
                    user_id: context.userId,
                    title: args.title,
                    company: args.company,
                    location: args.location,
                    description: args.description,
                    salary_min: args.salary_min,
                    salary_max: args.salary_max,
                    source_url: args.source_url,
                    job_type: args.job_type,
                    status: 'saved'
                })
                .select()
                .single()

            if (error) throw error

            let analysisTask: { taskId: string; status: 'pending' } | null = null
            let analysisTaskError: string | null = null

            try {
                analysisTask = await enqueueAutomaticJobAnalysis({
                    supabase: context.supabase as any,
                    userId: context.userId,
                    jobId: data.id,
                    source: 'agent_save_job',
                    triggerAnalysisTask: async (payload) => {
                        await tasks.trigger('analyze-saved-job', payload)
                    }
                })
            } catch (enqueueError) {
                analysisTaskError = enqueueError instanceof Error ? enqueueError.message : 'Failed to queue automatic job analysis'
                console.error('Failed to queue automatic job analysis from SaveJobTool:', enqueueError)
            }

            return {
                success: true,
                jobId: data.id,
                analysisTask,
                analysisTaskError,
                message: 'Job saved successfully'
            }
        } catch (error) {
            console.error('Failed to save job:', error)
            return {
                success: false,
                error: (error as Error).message
            }
        }
    }
}
