import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'
import {
  generateCoverLetter,
  type CoverLetterInput,
} from '@/lib/cover-letter-generator'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * POST /api/jobs/[id]/cover-letter
 * 为指定岗位生成求职信
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: jobId } = await params
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 获取请求参数
    const body = await request.json()
    const { tone = 'professional', language = 'en' } = body as {
      tone?: 'professional' | 'friendly' | 'formal'
      language?: 'en' | 'zh'
    }

    // 获取岗位信息
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .eq('user_id', user.id)
      .single()

    if (jobError || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    // 获取用户Profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Please complete your profile first' },
        { status: 400 }
      )
    }

    // 获取工作经历
    const { data: workExperiences } = await supabase
      .from('work_experiences')
      .select('*')
      .eq('user_id', user.id)
      .order('start_date', { ascending: false })
      .limit(3) // 只取最近3份工作

    // 获取技能
    const { data: skills } = await supabase
      .from('user_skills')
      .select('*')
      .eq('user_id', user.id)
      .limit(15) // 取前15个技能

    // 构建生成输入
    const input: CoverLetterInput = {
      profile: {
        full_name: profile.full_name || '求职者',
        email: profile.email,
        phone: profile.phone,
        location: profile.location,
        professional_summary: profile.professional_summary,
      },
      workExperiences: (workExperiences || []).map((w) => ({
        company: w.company,
        position: w.position,
        start_date: w.start_date,
        end_date: w.end_date,
        is_current: w.is_current,
        description: w.description,
        achievements: w.achievements,
        technologies: w.technologies,
      })),
      skills: (skills || []).map((s) => ({
        name: s.name,
        level: s.level,
        category: s.category,
      })),
      job: {
        title: job.title,
        company: job.company,
        location: job.location,
        description: job.description,
        requirements: job.requirements,
      },
      tone,
      language,
    }

    // 生成求职信
    console.log(`📝 Generating cover letter for job: ${job.title}`)
    const coverLetter = await generateCoverLetter(input)

    // 保存求职信到数据库
    const coverLetterTitle = `求职信 - ${job.title} at ${job.company}`
    const { data: savedCoverLetter, error: saveError } = await supabase
      .from('cover_letters')
      .insert({
        user_id: user.id,
        job_id: jobId,
        title: coverLetterTitle,
        content: coverLetter.content,
        source: 'ai_generated',
      })
      .select()
      .single()

    if (saveError) {
      console.error('Error saving cover letter:', saveError)
      // 不影响返回，继续返回生成的求职信
    } else {
      console.log('✅ Cover letter saved:', savedCoverLetter.id)
    }

    return NextResponse.json({
      success: true,
      coverLetter,
      coverLetterId: savedCoverLetter?.id,
      job: {
        id: job.id,
        title: job.title,
        company: job.company,
      },
    })
  } catch (error) {
    console.error('Error in POST /api/jobs/[id]/cover-letter:', error)
    return NextResponse.json(
      { error: 'Failed to generate cover letter' },
      { status: 500 }
    )
  }
}
