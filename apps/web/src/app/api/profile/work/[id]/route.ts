import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'
import type { WorkExperienceInput } from '@careermatch/shared'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/profile/work/[id]
 * 获取单个工作经历
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: work, error } = await supabase
      .from('work_experiences')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Work experience not found' },
          { status: 404 }
        )
      }
      console.error('Error fetching work experience:', error)
      return NextResponse.json(
        { error: 'Failed to fetch work experience' },
        { status: 500 }
      )
    }

    return NextResponse.json(work)
  } catch (error) {
    console.error('Error in GET /api/profile/work/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/profile/work/[id]
 * 更新工作经历
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: Partial<WorkExperienceInput> = await request.json()

    // 验证必填字段（如果提供）
    if (body.company !== undefined && !body.company.trim()) {
      return NextResponse.json(
        { error: 'Company cannot be empty' },
        { status: 400 }
      )
    }

    if (body.position !== undefined && !body.position.trim()) {
      return NextResponse.json(
        { error: 'Position cannot be empty' },
        { status: 400 }
      )
    }

    const { data: work, error } = await supabase
      .from('work_experiences')
      .update({
        company: body.company,
        position: body.position,
        location: body.location,
        start_date: body.start_date,
        end_date: body.end_date,
        is_current: body.is_current,
        description: body.description,
        achievements: body.achievements,
        technologies: body.technologies,
        display_order: body.display_order,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Work experience not found' },
          { status: 404 }
        )
      }
      console.error('Error updating work experience:', error)
      return NextResponse.json(
        { error: 'Failed to update work experience' },
        { status: 500 }
      )
    }

    return NextResponse.json(work)
  } catch (error) {
    console.error('Error in PUT /api/profile/work/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/profile/work/[id]
 * 删除工作经历
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { error } = await supabase
      .from('work_experiences')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error deleting work experience:', error)
      return NextResponse.json(
        { error: 'Failed to delete work experience' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/profile/work/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
