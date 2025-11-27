import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'
import type { UserProjectInput } from '@careermatch/shared'

/**
 * POST /api/profile/projects
 * 创建项目
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

    const body: UserProjectInput = await request.json()

    if (!body.name?.trim()) {
      return NextResponse.json(
        { error: 'Project name is required' },
        { status: 400 }
      )
    }

    if (!body.description?.trim()) {
      return NextResponse.json(
        { error: 'Project description is required' },
        { status: 400 }
      )
    }

    // 获取当前最大display_order
    const { data: maxOrderData } = await supabase
      .from('user_projects')
      .select('display_order')
      .eq('user_id', user.id)
      .order('display_order', { ascending: false })
      .limit(1)
      .single()

    const nextOrder = (maxOrderData?.display_order || 0) + 1

    const { data: project, error } = await supabase
      .from('user_projects')
      .insert({
        user_id: user.id,
        name: body.name,
        description: body.description,
        role: body.role,
        start_date: body.start_date,
        end_date: body.end_date,
        technologies: body.technologies || [],
        highlights: body.highlights || [],
        url: body.url,
        github_url: body.github_url,
        display_order: body.display_order ?? nextOrder,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating project:', error)
      return NextResponse.json(
        { error: 'Failed to create project' },
        { status: 500 }
      )
    }

    return NextResponse.json(project, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/profile/projects:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/profile/projects
 * 获取所有项目
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

    const { data: projects, error } = await supabase
      .from('user_projects')
      .select('*')
      .eq('user_id', user.id)
      .order('display_order')
      .order('start_date', { ascending: false })

    if (error) {
      console.error('Error fetching projects:', error)
      return NextResponse.json(
        { error: 'Failed to fetch projects' },
        { status: 500 }
      )
    }

    return NextResponse.json(projects)
  } catch (error) {
    console.error('Error in GET /api/profile/projects:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
