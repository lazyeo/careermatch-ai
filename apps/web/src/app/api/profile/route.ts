import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'
import type { UpdateProfileRequest, FullProfile, ProfileCompleteness } from '@careermatch/shared'

/**
 * GET /api/profile
 * 获取完整个人资料（包含所有子资源）
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 检查是否只需要completeness
    const url = new URL(request.url)
    const completenessOnly = url.searchParams.get('completeness') === 'true'

    if (completenessOnly) {
      // 使用数据库函数获取完成度
      const { data: completeness, error } = await supabase
        .rpc('get_profile_completeness', { user_uuid: user.id })

      if (error) {
        console.error('Error fetching profile completeness:', error)
        return NextResponse.json(
          { error: 'Failed to fetch profile completeness' },
          { status: 500 }
        )
      }

      return NextResponse.json(completeness as ProfileCompleteness)
    }

    // 并行获取所有资源
    const [
      profileResult,
      workResult,
      educationResult,
      skillsResult,
      projectsResult,
      certificationsResult,
    ] = await Promise.all([
      supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single(),
      supabase
        .from('work_experiences')
        .select('*')
        .eq('user_id', user.id)
        .order('display_order')
        .order('start_date', { ascending: false }),
      supabase
        .from('education_records')
        .select('*')
        .eq('user_id', user.id)
        .order('display_order')
        .order('start_date', { ascending: false }),
      supabase
        .from('user_skills')
        .select('*')
        .eq('user_id', user.id)
        .order('display_order')
        .order('category'),
      supabase
        .from('user_projects')
        .select('*')
        .eq('user_id', user.id)
        .order('display_order')
        .order('start_date', { ascending: false }),
      supabase
        .from('user_certifications')
        .select('*')
        .eq('user_id', user.id)
        .order('display_order')
        .order('issue_date', { ascending: false }),
    ])

    // 如果Profile不存在，创建一个
    let profile = profileResult.data
    if (!profile && profileResult.error?.code === 'PGRST116') {
      const { data: newProfile, error: createError } = await supabase
        .from('user_profiles')
        .insert({
          user_id: user.id,
          full_name: user.user_metadata?.full_name || user.user_metadata?.name || '',
          email: user.email || '',
          avatar_url: user.user_metadata?.avatar_url,
        })
        .select()
        .single()

      if (createError) {
        console.error('Error creating profile:', createError)
        return NextResponse.json(
          { error: 'Failed to create profile' },
          { status: 500 }
        )
      }
      profile = newProfile
    } else if (profileResult.error) {
      console.error('Error fetching profile:', profileResult.error)
      return NextResponse.json(
        { error: 'Failed to fetch profile' },
        { status: 500 }
      )
    }

    const fullProfile: FullProfile = {
      profile,
      work_experiences: workResult.data || [],
      education_records: educationResult.data || [],
      skills: skillsResult.data || [],
      projects: projectsResult.data || [],
      certifications: certificationsResult.data || [],
    }

    return NextResponse.json(fullProfile)
  } catch (error) {
    console.error('Error in GET /api/profile:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/profile
 * 更新个人基本信息
 */
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: UpdateProfileRequest = await request.json()

    // 验证必填字段
    if (body.full_name !== undefined && !body.full_name.trim()) {
      return NextResponse.json(
        { error: 'Full name cannot be empty' },
        { status: 400 }
      )
    }

    if (body.email !== undefined && !body.email.trim()) {
      return NextResponse.json(
        { error: 'Email cannot be empty' },
        { status: 400 }
      )
    }

    // 更新Profile
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .update({
        full_name: body.full_name,
        email: body.email,
        phone: body.phone,
        location: body.location,
        linkedin_url: body.linkedin_url,
        github_url: body.github_url,
        website_url: body.website_url,
        professional_summary: body.professional_summary,
        target_roles: body.target_roles,
        extended_data: body.extended_data,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      // 如果不存在则创建
      if (error.code === 'PGRST116') {
        const { data: newProfile, error: createError } = await supabase
          .from('user_profiles')
          .insert({
            user_id: user.id,
            full_name: body.full_name || '',
            email: body.email || user.email || '',
            phone: body.phone,
            location: body.location,
            linkedin_url: body.linkedin_url,
            github_url: body.github_url,
            website_url: body.website_url,
            professional_summary: body.professional_summary,
            target_roles: body.target_roles || [],
            extended_data: body.extended_data || {},
          })
          .select()
          .single()

        if (createError) {
          console.error('Error creating profile:', createError)
          return NextResponse.json(
            { error: 'Failed to create profile' },
            { status: 500 }
          )
        }

        return NextResponse.json(newProfile, { status: 201 })
      }

      console.error('Error updating profile:', error)
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500 }
      )
    }

    return NextResponse.json(profile)
  } catch (error) {
    console.error('Error in PUT /api/profile:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
