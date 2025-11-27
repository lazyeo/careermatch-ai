import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'
import type { EducationRecordInput } from '@careermatch/shared'

/**
 * POST /api/profile/education
 * 创建教育背景
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: EducationRecordInput = await request.json()

    // 验证必填字段
    if (!body.institution?.trim()) {
      return NextResponse.json(
        { error: 'Institution is required' },
        { status: 400 }
      )
    }

    if (!body.degree?.trim()) {
      return NextResponse.json(
        { error: 'Degree is required' },
        { status: 400 }
      )
    }

    if (!body.major?.trim()) {
      return NextResponse.json(
        { error: 'Major is required' },
        { status: 400 }
      )
    }

    if (!body.start_date) {
      return NextResponse.json(
        { error: 'Start date is required' },
        { status: 400 }
      )
    }

    // 获取当前最大display_order
    const { data: maxOrderData } = await supabase
      .from('education_records')
      .select('display_order')
      .eq('user_id', user.id)
      .order('display_order', { ascending: false })
      .limit(1)
      .single()

    const nextOrder = (maxOrderData?.display_order || 0) + 1

    const { data: education, error } = await supabase
      .from('education_records')
      .insert({
        user_id: user.id,
        institution: body.institution,
        degree: body.degree,
        major: body.major,
        location: body.location,
        start_date: body.start_date,
        end_date: body.end_date,
        is_current: body.is_current || false,
        gpa: body.gpa,
        achievements: body.achievements || [],
        display_order: body.display_order ?? nextOrder,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating education record:', error)
      return NextResponse.json(
        { error: 'Failed to create education record' },
        { status: 500 }
      )
    }

    return NextResponse.json(education, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/profile/education:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/profile/education
 * 获取所有教育背景
 */
export async function GET() {
  try {
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
      .eq('user_id', user.id)
      .order('display_order')
      .order('start_date', { ascending: false })

    if (error) {
      console.error('Error fetching education records:', error)
      return NextResponse.json(
        { error: 'Failed to fetch education records' },
        { status: 500 }
      )
    }

    return NextResponse.json(education)
  } catch (error) {
    console.error('Error in GET /api/profile/education:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
