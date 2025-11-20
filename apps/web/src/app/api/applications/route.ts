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

    // Initialize timeline with creation event
    const initialTimeline = [
      {
        type: 'created',
        date: new Date().toISOString(),
        description: '创建申请记录',
      },
    ]

    // If status is submitted, add submission event
    if (status === 'submitted') {
      initialTimeline.push({
        type: 'submitted',
        date: new Date().toISOString(),
        description: '提交申请',
      })
    }

    // Create the application
    const { data: application, error } = await supabase
      .from('applications')
      .insert({
        user_id: user.id,
        job_id: jobId,
        resume_id: resumeId,
        status,
        notes,
        timeline: initialTimeline,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating application:', error)

      // Check for unique constraint violation
      if (error.code === '23505') {
        return NextResponse.json(
          { error: '该岗位已经创建过申请记录' },
          { status: 409 }
        )
      }

      return NextResponse.json(
        { error: 'Failed to create application' },
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
