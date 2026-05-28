import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/applications
 *
 * Fetches all applications for the current user
 */
export async function GET() {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch applications with related job and resume data
    const { data: applications, error } = await supabase
      .from('applications')
      .select(`
        *,
        jobs:job_id (
          id,
          title,
          company,
          location,
          status
        ),
        resumes:resume_id (
          id,
          title,
          content
        )
      `)
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('Error fetching applications:', error)
      return NextResponse.json(
        { error: 'Failed to fetch applications' },
        { status: 500 }
      )
    }

    return NextResponse.json(applications || [])
  } catch (error) {
    console.error('Error in GET /api/applications:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/applications
 *
 * Creates a new application
 * Body: { jobId, resumeId, status?, notes? }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { jobId, resumeId, status = 'draft', notes } = body

    // Validate required fields
    if (!jobId || !resumeId) {
      return NextResponse.json(
        { error: 'jobId and resumeId are required' },
        { status: 400 }
      )
    }

    const [{ data: job }, { data: resume }] = await Promise.all([
      supabase
        .from('jobs')
        .select('id')
        .eq('id', jobId)
        .eq('user_id', user.id)
        .maybeSingle(),
      supabase
        .from('resumes')
        .select('id')
        .eq('id', resumeId)
        .eq('user_id', user.id)
        .maybeSingle(),
    ])

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    if (!resume) {
      return NextResponse.json({ error: 'Resume not found' }, { status: 404 })
    }

    const { data: existingApplication, error: existingError } = await supabase
      .from('applications')
      .select('*')
      .eq('user_id', user.id)
      .eq('job_id', jobId)
      .maybeSingle()

    if (existingError) {
      console.error('Error checking existing application:', existingError)
      return NextResponse.json(
        {
          error: 'Failed to check existing application',
          details: existingError.message,
        },
        { status: 500 }
      )
    }

    if (existingApplication) {
      return NextResponse.json({
        ...existingApplication,
        already_exists: true,
      })
    }

    // Initialize timeline with creation event
    const initialTimeline = [
      {
        type: 'created',
        date: new Date().toISOString(),
        description: 'Application created',
      },
    ]

    // If status is submitted, add submission event
    if (status === 'submitted') {
      initialTimeline.push({
        type: 'submitted',
        date: new Date().toISOString(),
        description: 'Application submitted',
      })
    }

    const applicationPayload = {
      user_id: user.id,
      job_id: jobId,
      resume_id: resumeId,
      status,
      notes,
      timeline: initialTimeline,
    }

    // Create the application
    let { data: application, error } = await supabase
      .from('applications')
      .insert(applicationPayload)
      .select()
      .single()

    if (isArchivedResumeForeignKeyError(error)) {
      console.warn(
        'applications.resume_id still points at resumes_v1_archived; creating application without resume link',
        error
      )

      const fallbackResult = await supabase
        .from('applications')
        .insert({
          ...applicationPayload,
          resume_id: null,
          timeline: [
            ...initialTimeline,
            {
              type: 'resume_link_skipped',
              date: new Date().toISOString(),
              description:
                'Resume link skipped because the applications resume foreign key is awaiting migration.',
            },
          ],
        })
        .select()
        .single()

      application = fallbackResult.data
      error = fallbackResult.error
    }

    if (error) {
      console.error('Error creating application:', error)

      // Check for unique constraint violation
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'An application already exists for this job' },
          { status: 409 }
        )
      }

      return NextResponse.json(
        {
          error: 'Failed to create application',
          details: error.message,
          code: error.code,
        },
        { status: 500 }
      )
    }

    return NextResponse.json(application, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/applications:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function isArchivedResumeForeignKeyError(error: { code?: string; message?: string; details?: string } | null) {
  if (!error) return false

  return (
    error.code === '23503' &&
    error.message?.includes('applications_resume_id_fkey') &&
    error.details?.includes('resumes_v1_archived')
  )
}
