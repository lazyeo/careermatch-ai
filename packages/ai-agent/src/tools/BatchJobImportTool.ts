import { Tool } from '../core/Tool'
import { parseJobFromUrl } from '@careermatch/job-scraper'
import { SupabaseClient } from '@supabase/supabase-js'

export class BatchJobImportTool implements Tool {
    name = 'batch_import_jobs'
    description = 'Import multiple jobs from a list of URLs. Use this when the user provides one or more job links to save or analyze.'

    parameters = {
        type: 'object' as const,
        properties: {
            urls: {
                type: 'array',
                items: {
                    type: 'string'
                },
                description: 'List of job URLs to import',
            },
        },
        required: ['urls'],
    }

    constructor(private config: { scraperUrl?: string; apiKey?: string; baseUrl?: string }) { }

    async execute(args: { urls: string[] }, context: { userId: string; supabase: SupabaseClient }) {
        const results = []
        const { userId, supabase } = context

        console.log(`🛠️ Tool Execution: batch_import_jobs for ${args.urls.length} URLs`)

        for (const url of args.urls) {
            try {
                // 1. Parse
                const parsedData = await parseJobFromUrl(url, {
                    scraperUrl: this.config.scraperUrl,
                    apiKey: this.config.apiKey,
                    baseUrl: this.config.baseUrl
                })

                // 2. Save to DB
                if (parsedData.title && parsedData.company) {
                    const { data: job, error } = await supabase
                        .from('jobs')
                        .insert({
                            user_id: userId,
                            title: parsedData.title,
                            company: parsedData.company,
                            location: parsedData.location || null,
                            job_type: parsedData.job_type || null,
                            salary_min: parsedData.salary_min || null,
                            salary_max: parsedData.salary_max || null,
                            salary_currency: parsedData.salary_currency || 'NZD',
                            description: parsedData.description || null,
                            requirements: parsedData.requirements || null,
                            benefits: parsedData.benefits || null,
                            source_url: url,
                            posted_date: parsedData.posted_date || null,
                            deadline: parsedData.deadline || null,
                            status: 'saved',
                        })
                        .select()
                        .single()

                    if (error) throw error

                    results.push({
                        url,
                        success: true,
                        title: parsedData.title,
                        company: parsedData.company,
                        jobId: job.id
                    })
                } else {
                    results.push({
                        url,
                        success: false,
                        error: 'Could not extract title or company'
                    })
                }

            } catch (error) {
                console.error(`❌ Error importing ${url}:`, error)
                results.push({
                    url,
                    success: false,
                    error: (error as Error).message
                })
            }
        }

        const successCount = results.filter(r => r.success).length
        const failCount = results.filter(r => !r.success).length

        return {
            summary: `Imported ${successCount} jobs, failed ${failCount}.`,
            results
        }
    }
}
