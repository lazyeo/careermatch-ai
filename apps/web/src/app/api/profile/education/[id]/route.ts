import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'
import type { EducationRecordInput } from '@careermatch/shared'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/profile/education/[id]
 * 获取单个教育背景
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

    const { data: education, error } = await supabase
      .from('education_records')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Education record not found' },
          { status: 404 }
        )
      }
      console.error('Error fetching education record:', error)
      return NextResponse.json(
        { error: 'Failed to fetch education record' },
        { status: 500 }
      )
    }

    return NextResponse.json(education)
  } catch (error) {
    console.error('Error in GET /api/profile/education/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/profile/education/[id]
 * 更新教育背景
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

    const body: Partial<EducationRecordInput> = await request.json()

    const { data: education, error } = await supabase
      .from('education_records')
      .update({
        institution: body.institution,
        degree: body.degree,
        major: body.major,
        location: body.location,
        start_date: body.start_date,
        end_date: body.end_date,
        is_current: body.is_current,
        gpa: body.gpa,
        achievements: body.achievements,
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
          { error: 'Education record not found' },
          { status: 404 }
        )
      }
      console.error('Error updating education record:', error)
      return NextResponse.json(
        { error: 'Failed to update education record' },
        { status: 500 }
      )
    }

    return NextResponse.json(education)
  } catch (error) {
    console.error('Error in PUT /api/profile/education/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/profile/education/[id]
 * 删除教育背景
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
      .from('education_records')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error deleting education record:', error)
      return NextResponse.json(
        { error: 'Failed to delete education record' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/profile/education/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
