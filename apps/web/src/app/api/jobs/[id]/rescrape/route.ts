import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'
import { parseJobFromUrl } from '@careermatch/job-scraper'

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
            // Pass other config if needed
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

        return NextResponse.json(updatedJob)
    } catch (error) {
        console.error('Error in POST /api/jobs/[id]/rescrape:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
