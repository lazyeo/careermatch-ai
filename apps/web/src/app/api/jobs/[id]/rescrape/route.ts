import { createClient } from '@/lib/supabase-server'
import { enqueueAutomaticJobAnalysis } from '@/lib/jobs/enqueue-job-analysis'
import { tasks } from '@trigger.dev/sdk/v3'
import { NextRequest, NextResponse } from 'next/server'
import { parseJobFromUrl } from '@careermatch/job-scraper'
import { completeJobParsingPrompt } from '@/lib/jobs/job-parser-ai'

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = await createClient()
        const { id } = params

        // 1. Check authentication
        const {
            data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // 2. Fetch the job to get the source_url
        const { data: job, error: fetchError } = await supabase
            .from('jobs')
            .select('source_url')
            .eq('id', id)
            .eq('user_id', user.id)
            .single()

        if (fetchError || !job) {
            return NextResponse.json({ error: 'Job not found' }, { status: 404 })
        }

        if (!job.source_url) {
            return NextResponse.json(
                { error: 'No source URL available for this job' },
                { status: 400 }
            )
        }

        // 3. Re-scrape the job
        // Note: parseJobFromUrl now uses the improved scraper logic (including Workable API)
        const parsedData = await parseJobFromUrl(job.source_url, {
            scraperUrl: process.env.SCRAPER_API_URL,
            aiComplete: completeJobParsingPrompt,
        })

        if (!parsedData.title || !parsedData.company) {
            return NextResponse.json(
                { error: 'Failed to re-parse job details' },
                { status: 500 }
            )
        }

        // 4. Update the job record
        const { data: updatedJob, error: updateError } = await supabase
            .from('jobs')
            .update({
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
                original_content: parsedData.original_content || null,
                // Don't update source_url, posted_date, deadline unless necessary
                // status is preserved
                updated_at: new Date().toISOString(),
            })
            .eq('id', id)
            .select()
            .single()

        if (updateError) {
            throw updateError
        }

        let analysisTask: { taskId: string; status: 'pending' } | null = null
        let analysisTaskError: string | null = null

        try {
            analysisTask = await enqueueAutomaticJobAnalysis({
                supabase,
                userId: user.id,
                jobId: id,
                source: 'job_rescrape',
                triggerAnalysisTask: async (payload) => {
                    await tasks.trigger('analyze-saved-job', payload)
                },
            })
        } catch (enqueueError) {
            analysisTaskError =
                enqueueError instanceof Error
                    ? enqueueError.message
                    : 'Failed to queue automatic job analysis'
            console.error('Failed to queue automatic analysis after rescrape:', enqueueError)
        }

        return NextResponse.json({
            ...updatedJob,
            analysis_task: analysisTask,
            analysis_task_error: analysisTaskError,
        })
    } catch (error) {
        console.error('Error in POST /api/jobs/[id]/rescrape:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
