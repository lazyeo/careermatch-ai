import { Tool } from '../core/Tool'
import { parseJobFromUrl } from '@careermatch/job-scraper'

export class JobScraperTool implements Tool {
    name = 'scrape_job'
    description = 'Scrape and parse job details from a given URL. Use this when the user provides a link to a job posting.'

    parameters = {
        type: 'object' as const,
        properties: {
            url: {
                type: 'string',
                description: 'The URL of the job posting to scrape',
            },
        },
        required: ['url'],
    }

    constructor(private config: { scraperUrl?: string; apiKey?: string; baseUrl?: string }) { }

    async execute(args: { url: string }) {
        try {
            console.log(`🛠️ Tool Execution: scrape_job for ${args.url}`)
            const result = await parseJobFromUrl(args.url, {
                scraperUrl: this.config.scraperUrl,
                apiKey: this.config.apiKey,
                baseUrl: this.config.baseUrl
            })

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
