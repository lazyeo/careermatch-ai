import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/applications/[id]
 *
 * Fetches a single application with related data
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch application with related data
    const { data: application, error } = await supabase
      .from('applications')
      .select(`
        *,
        jobs:job_id (
          id,
          title,
          company,
          location,
          job_type,
          salary_min,
          salary_max,
          salary_currency,
          description,
          requirements,
          status
        ),
        resumes:resume_id (
          id,
          full_name,
          email,
          phone
        )
      `)
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single()

    if (error) {
      console.error('Error fetching application:', error)
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      )
    }

    // Fetch interviews for this application
    const { data: interviews } = await supabase
      .from('interviews')
      .select('*')
      .eq('application_id', params.id)
      .order('scheduled_date', { ascending: true })

    return NextResponse.json({
      ...application,
      interviews: interviews || [],
    })
  } catch (error) {
    console.error('Error in GET /api/applications/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/applications/[id]
 *
 * Updates an application
 * Body: { status?, notes?, timeline? }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const { status, notes, timeline } = body

    // Get current application to update timeline
    const { data: currentApp } = await supabase
      .from('applications')
      .select('status, timeline')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single()

    let updatedTimeline = timeline || currentApp?.timeline || []

    // If status changed, add timeline event
    if (status && status !== currentApp?.status) {
      const statusLabels: Record<string, string> = {
        draft: '草稿',
        submitted: '已提交',
        under_review: '审核中',
        interview_scheduled: '面试安排',
        offer_received: '录取',
        rejected: '拒绝',
        withdrawn: '已撤回',
        accepted: '已接受',
      }

      updatedTimeline = [
        ...updatedTimeline,
        {
          type: 'status_change',
          date: new Date().toISOString(),
          description: `状态更新为: ${statusLabels[status] || status}`,
          oldStatus: currentApp?.status,
          newStatus: status,
        },
      ]
    }

    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    if (status) updateData.status = status
    if (notes !== undefined) updateData.notes = notes
    if (updatedTimeline) updateData.timeline = updatedTimeline

    // Update the application
    const { data: application, error } = await supabase
      .from('applications')
      .update(updateData)
      .eq('id', params.id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating application:', error)
      return NextResponse.json(
        { error: 'Failed to update application' },
        { status: 500 }
      )
    }

    return NextResponse.json(application)
  } catch (error) {
    console.error('Error in PATCH /api/applications/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/applications/[id]
 *
 * Deletes an application
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Delete the application (cascades to interviews)
    const { error } = await supabase
      .from('applications')
      .delete()
      .eq('id', params.id)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error deleting application:', error)
      return NextResponse.json(
        { error: 'Failed to delete application' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/applications/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
