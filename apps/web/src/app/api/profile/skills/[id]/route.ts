import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'
import type { UserSkillInput } from '@careermatch/shared'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/profile/skills/[id]
 * 获取单个技能
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

    const { data: skill, error } = await supabase
      .from('user_skills')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Skill not found' },
          { status: 404 }
        )
      }
      console.error('Error fetching skill:', error)
      return NextResponse.json(
        { error: 'Failed to fetch skill' },
        { status: 500 }
      )
    }

    return NextResponse.json(skill)
  } catch (error) {
    console.error('Error in GET /api/profile/skills/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/profile/skills/[id]
 * 更新技能
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

    const body: Partial<UserSkillInput> = await request.json()

    const { data: skill, error } = await supabase
      .from('user_skills')
      .update({
        name: body.name,
        level: body.level,
        years_experience: body.years_experience,
        category: body.category,
        display_order: body.display_order,
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Skill not found' },
          { status: 404 }
        )
      }
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Skill name already exists' },
          { status: 409 }
        )
      }
      console.error('Error updating skill:', error)
      return NextResponse.json(
        { error: 'Failed to update skill' },
        { status: 500 }
      )
    }

    return NextResponse.json(skill)
  } catch (error) {
    console.error('Error in PUT /api/profile/skills/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/profile/skills/[id]
 * 删除技能
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
      .from('user_skills')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error deleting skill:', error)
      return NextResponse.json(
        { error: 'Failed to delete skill' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/profile/skills/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
