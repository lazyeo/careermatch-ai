import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'
import type { WorkExperienceInput } from '@careermatch/shared'

/**
 * POST /api/profile/work
 * 创建工作经历
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

    const body: WorkExperienceInput = await request.json()

    // 验证必填字段
    if (!body.company?.trim()) {
      return NextResponse.json(
        { error: 'Company is required' },
        { status: 400 }
      )
    }

    if (!body.position?.trim()) {
      return NextResponse.json(
        { error: 'Position is required' },
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
      .from('work_experiences')
      .select('display_order')
      .eq('user_id', user.id)
      .order('display_order', { ascending: false })
      .limit(1)
      .single()

    const nextOrder = (maxOrderData?.display_order || 0) + 1

    // 创建工作经历
    const { data: work, error } = await supabase
      .from('work_experiences')
      .insert({
        user_id: user.id,
        company: body.company,
        position: body.position,
        location: body.location,
        start_date: body.start_date,
        end_date: body.end_date,
        is_current: body.is_current || false,
        description: body.description,
        achievements: body.achievements || [],
        technologies: body.technologies || [],
        display_order: body.display_order ?? nextOrder,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating work experience:', error)
      return NextResponse.json(
        { error: 'Failed to create work experience' },
        { status: 500 }
      )
    }

    return NextResponse.json(work, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/profile/work:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/profile/work
 * 获取所有工作经历
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

    const { data: works, error } = await supabase
      .from('work_experiences')
      .select('*')
      .eq('user_id', user.id)
      .order('display_order')
      .order('start_date', { ascending: false })

    if (error) {
      console.error('Error fetching work experiences:', error)
      return NextResponse.json(
        { error: 'Failed to fetch work experiences' },
        { status: 500 }
      )
    }

    return NextResponse.json(works)
  } catch (error) {
    console.error('Error in GET /api/profile/work:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
