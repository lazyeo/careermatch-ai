import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'
import type { ParsedResumeData, ApplyParsedDataRequest } from '@careermatch/shared'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * POST /api/resume-upload/[id]/apply
 * 将解析结果应用到用户的个人资料
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 获取上传记录和解析数据
    const { data: upload, error: fetchError } = await supabase
      .from('resume_uploads')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !upload) {
      return NextResponse.json(
        { error: 'Upload record not found' },
        { status: 404 }
      )
    }

    if (upload.status !== 'completed' || !upload.parsed_data) {
      return NextResponse.json(
        { error: 'Resume has not been parsed yet' },
        { status: 400 }
      )
    }

    const parsedData = upload.parsed_data as ParsedResumeData

    // 获取请求体中的选项
    let options: Partial<ApplyParsedDataRequest> = {}
    try {
      options = await request.json()
    } catch {
      // 如果没有请求体，使用默认选项（应用所有）
    }

    const sectionsToApply = options.sections_to_apply || {
      personal_info: true,
      work_experiences: true,
      education: true,
      skills: true,
      projects: true,
      certifications: true,
    }

    const mergeStrategy = options.merge_strategy || 'replace'

    const results: Record<string, { success: boolean; count?: number; error?: string }> = {}

    // 1. 应用基本信息
    if (sectionsToApply.personal_info && parsedData.personal_info) {
      try {
        const { full_name, email, phone, location, linkedin_url, github_url, website_url, professional_summary } = parsedData.personal_info

        // 检查是否存在profile
        const { data: existingProfile } = await supabase
          .from('user_profiles')
          .select('id')
          .eq('user_id', user.id)
          .single()

        if (existingProfile) {
          // 更新现有profile
          await supabase
            .from('user_profiles')
            .update({
              full_name: full_name || existingProfile,
              email: email || user.email || '',
              phone,
              location,
              linkedin_url,
              github_url,
              website_url,
              professional_summary,
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', user.id)
        } else {
          // 创建新profile
          await supabase
            .from('user_profiles')
            .insert({
              user_id: user.id,
              full_name: full_name || '',
              email: email || user.email || '',
              phone,
              location,
              linkedin_url,
              github_url,
              website_url,
              professional_summary,
            })
        }

        results.personal_info = { success: true }
      } catch (error) {
        console.error('Error applying personal info:', error)
        results.personal_info = { success: false, error: 'Failed to apply personal info' }
      }
    }

    // 2. 应用工作经历
    if (sectionsToApply.work_experiences && parsedData.work_experiences?.length > 0) {
      try {
        if (mergeStrategy === 'replace') {
          // 删除现有记录
          await supabase
            .from('work_experiences')
            .delete()
            .eq('user_id', user.id)
        }

        // 插入新记录
        const workData = parsedData.work_experiences.map((w, index) => ({
          user_id: user.id,
          company: w.company,
          position: w.position,
          location: w.location,
          start_date: w.start_date,
          end_date: w.end_date || null,
          is_current: w.is_current || false,
          description: w.description,
          achievements: w.achievements || [],
          technologies: w.technologies || [],
          display_order: index,
        }))

        await supabase.from('work_experiences').insert(workData)

        results.work_experiences = { success: true, count: workData.length }
      } catch (error) {
        console.error('Error applying work experiences:', error)
        results.work_experiences = { success: false, error: 'Failed to apply work experiences' }
      }
    }

    // 3. 应用教育背景
    if (sectionsToApply.education && parsedData.education?.length > 0) {
      try {
        if (mergeStrategy === 'replace') {
          await supabase
            .from('education_records')
            .delete()
            .eq('user_id', user.id)
        }

        const eduData = parsedData.education.map((e, index) => ({
          user_id: user.id,
          institution: e.institution,
          degree: e.degree,
          major: e.major,
          location: e.location,
          start_date: e.start_date,
          end_date: e.end_date || null,
          is_current: e.is_current || false,
          gpa: e.gpa,
          achievements: e.achievements || [],
          display_order: index,
        }))

        await supabase.from('education_records').insert(eduData)

        results.education = { success: true, count: eduData.length }
      } catch (error) {
        console.error('Error applying education:', error)
        results.education = { success: false, error: 'Failed to apply education' }
      }
    }

    // 4. 应用技能
    if (sectionsToApply.skills && parsedData.skills?.length > 0) {
      try {
        if (mergeStrategy === 'replace') {
          await supabase
            .from('user_skills')
            .delete()
            .eq('user_id', user.id)
        }

        const skillData = parsedData.skills.map((s, index) => ({
          user_id: user.id,
          name: s.name,
          level: s.level,
          category: s.category,
          display_order: index,
        }))

        // 使用upsert来处理可能的重复
        await supabase.from('user_skills').upsert(skillData, {
          onConflict: 'user_id,name',
          ignoreDuplicates: true,
        })

        results.skills = { success: true, count: skillData.length }
      } catch (error) {
        console.error('Error applying skills:', error)
        results.skills = { success: false, error: 'Failed to apply skills' }
      }
    }

    // 5. 应用项目
    if (sectionsToApply.projects && parsedData.projects?.length > 0) {
      try {
        if (mergeStrategy === 'replace') {
          await supabase
            .from('user_projects')
            .delete()
            .eq('user_id', user.id)
        }

        const projectData = parsedData.projects.map((p, index) => ({
          user_id: user.id,
          name: p.name,
          description: p.description,
          role: p.role,
          start_date: p.start_date || null,
          end_date: p.end_date || null,
          technologies: p.technologies || [],
          highlights: p.highlights || [],
          url: p.url,
          github_url: p.github_url,
          display_order: index,
        }))

        await supabase.from('user_projects').insert(projectData)

        results.projects = { success: true, count: projectData.length }
      } catch (error) {
        console.error('Error applying projects:', error)
        results.projects = { success: false, error: 'Failed to apply projects' }
      }
    }

    // 6. 应用证书
    if (sectionsToApply.certifications && parsedData.certifications?.length > 0) {
      try {
        if (mergeStrategy === 'replace') {
          await supabase
            .from('user_certifications')
            .delete()
            .eq('user_id', user.id)
        }

        const certData = parsedData.certifications.map((c, index) => ({
          user_id: user.id,
          name: c.name,
          issuer: c.issuer,
          issue_date: c.issue_date,
          expiry_date: c.expiry_date || null,
          credential_id: c.credential_id,
          credential_url: c.credential_url,
          display_order: index,
        }))

        await supabase.from('user_certifications').insert(certData)

        results.certifications = { success: true, count: certData.length }
      } catch (error) {
        console.error('Error applying certifications:', error)
        results.certifications = { success: false, error: 'Failed to apply certifications' }
      }
    }

    // 检查是否有失败的部分
    const failedSections = Object.entries(results)
      .filter(([, r]) => !r.success)
      .map(([name]) => name)

    if (failedSections.length > 0) {
      return NextResponse.json({
        success: false,
        message: `Some sections failed to apply: ${failedSections.join(', ')}`,
        results,
      }, { status: 207 }) // Multi-Status
    }

    return NextResponse.json({
      success: true,
      message: 'All sections applied successfully',
      results,
    })
  } catch (error) {
    console.error('Error in POST /api/resume-upload/[id]/apply:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
