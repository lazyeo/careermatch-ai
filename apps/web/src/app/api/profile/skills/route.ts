import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'
import type { UserSkillInput } from '@careermatch/shared'

/**
 * POST /api/profile/skills
 * 创建技能
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

    const body: UserSkillInput = await request.json()

    if (!body.name?.trim()) {
      return NextResponse.json(
        { error: 'Skill name is required' },
        { status: 400 }
      )
    }

    // 获取当前最大display_order
    const { data: maxOrderData } = await supabase
      .from('user_skills')
      .select('display_order')
      .eq('user_id', user.id)
      .order('display_order', { ascending: false })
      .limit(1)
      .single()

    const nextOrder = (maxOrderData?.display_order || 0) + 1

    const { data: skill, error } = await supabase
      .from('user_skills')
      .insert({
        user_id: user.id,
        name: body.name,
        level: body.level,
        years_experience: body.years_experience,
        category: body.category,
        display_order: body.display_order ?? nextOrder,
      })
      .select()
      .single()

    if (error) {
      // 检查是否是唯一约束冲突
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Skill already exists' },
          { status: 409 }
        )
      }
      console.error('Error creating skill:', error)
      return NextResponse.json(
        { error: 'Failed to create skill' },
        { status: 500 }
      )
    }

    return NextResponse.json(skill, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/profile/skills:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/profile/skills
 * 获取所有技能
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

    const { data: skills, error } = await supabase
      .from('user_skills')
      .select('*')
      .eq('user_id', user.id)
      .order('display_order')
      .order('category')

    if (error) {
      console.error('Error fetching skills:', error)
      return NextResponse.json(
        { error: 'Failed to fetch skills' },
        { status: 500 }
      )
    }

    return NextResponse.json(skills)
  } catch (error) {
    console.error('Error in GET /api/profile/skills:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
