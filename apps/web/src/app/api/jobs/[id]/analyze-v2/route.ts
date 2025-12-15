/**
 * 8维度岗位分析 API V2
 *
 * POST /api/jobs/[id]/analyze-v2
 * 新版8维度分析 - 输出结构化CV策略和面试准备
 *
 * Body: { resumeId?: string, provider?: AIProviderType, force?: boolean }
 * - 如果提供resumeId，使用简历数据
 * - 如果不提供resumeId，使用Profile数据（推荐）
 *
 * Returns: {
 *   sessionId, score, recommendation, analysis,
 *   dimensions: AnalysisDimensions, // 8维度结构化数据
 *   provider, model
 * }
 */

import { createClient } from '@/lib/supabase-server'
import {
  createAIClient,
  isAnyAIConfigured,
  getBestModel,
  getDefaultProvider,
  TEMPERATURE_PRESETS,
  handleAIError,
  type AIProviderType,
} from '@/lib/ai-providers'
import { NextRequest, NextResponse } from 'next/server'
import type { FullProfile } from '@careermatch/shared'
import {
  getJobMatchingV2SystemPrompt,
  buildJobMatchingV2Prompt,
  parseJobMatchingV2Output,
  generateDefaultCVStrategy,
  type JobMatchingV2Output,
} from '@/lib/ai/prompts/features/job-matching-v2'


// =====================================================
// POST: 执行8维度分析
// =====================================================

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: jobId } = await params
    const supabase = await createClient()

    // 1. 验证用户
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. 检查AI配置
    if (!isAnyAIConfigured()) {
      return NextResponse.json(
        {
          error: 'No AI provider is configured',
          hint: 'Please add API keys to .env.local',
        },
        { status: 503 }
      )
    }

    // 3. 解析请求参数
    const body = await request.json()
    const { resumeId, provider, force, locale } = body as {
      resumeId?: string
      provider?: AIProviderType
      force?: boolean
      locale?: string
    }

    // 4. 检查缓存（除非force=true）
    if (!force) {
      const { data: existingSession } = await supabase
        .from('analysis_sessions')
        .select('*')
        .eq('job_id', jobId)
        .eq('user_id', user.id)
        .not('dimensions', 'is', null) // 只查找有dimensions的V2分析
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (existingSession) {
        console.log('✅ Returning cached V2 analysis session')
        return NextResponse.json({
          sessionId: existingSession.id,
          score: existingSession.score,
          recommendation: existingSession.recommendation,
          analysis: existingSession.analysis,
          dimensions: existingSession.dimensions,
          provider: existingSession.provider,
          model: existingSession.model,
        })
      }
    }

    // 5. 获取岗位信息
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .eq('user_id', user.id)
      .single()

    if (jobError || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    // 6. 获取Profile数据（推荐）或简历数据
    let profileData: FullProfile | null = null
    let resumeData: Record<string, unknown> | null = null

    if (resumeId) {
      // 使用简历数据
      const { data: resume, error: resumeError } = await supabase
        .from('resumes')
        .select('*')
        .eq('id', resumeId)
        .eq('user_id', user.id)
        .single()

      if (resumeError || !resume) {
        return NextResponse.json({ error: 'Resume not found' }, { status: 404 })
      }
      resumeData = resume
    } else {
      // 使用Profile数据（推荐）
      profileData = await fetchFullProfile(supabase, user.id)
      if (!profileData || !profileData.profile) {
        return NextResponse.json(
          { error: 'Profile not found. Please complete your profile first.' },
          { status: 404 }
        )
      }
    }

    // 7. 执行8维度分析
    const providerName = provider || getDefaultProvider()?.type || 'openai'
    const model = getBestModel(provider)

    console.log(`🤖 [V2] Calling ${providerName.toUpperCase()} for 8-dimension analysis...`)
    console.log(`📊 Using model: ${model}`)

    const analysisResult = await perform8DimensionAnalysis(
      job,
      profileData,
      resumeData,
      provider,
      locale
    )

    // 8. 保存到数据库
    const { data: savedSession, error: saveError } = await supabase
      .from('analysis_sessions')
      .insert({
        job_id: jobId,
        resume_id: resumeId || null,
        user_id: user.id,
        status: 'active',
        score: analysisResult.score,
        recommendation: analysisResult.recommendation,
        analysis: analysisResult.analysis,
        dimensions: analysisResult.dimensions, // 8维度结构化数据
        provider: providerName,
        model: model,
      })
      .select()
      .single()

    if (saveError) {
      console.error('Error saving V2 analysis session:', saveError)
      return NextResponse.json(
        { error: 'Failed to save analysis session' },
        { status: 500 }
      )
    }

    console.log('✅ V2 Analysis completed and saved')
    return NextResponse.json({
      sessionId: savedSession.id,
      score: savedSession.score,
      recommendation: savedSession.recommendation,
      analysis: savedSession.analysis,
      dimensions: savedSession.dimensions,
      provider: savedSession.provider,
      model: savedSession.model,
    })
  } catch (error) {
    console.error('Error in POST /api/jobs/[id]/analyze-v2:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// =====================================================
// GET: 获取已有的V2分析
// =====================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: jobId } = await params
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 获取最新的V2分析（有dimensions的）
    const { data: session, error } = await supabase
      .from('analysis_sessions')
      .select('*')
      .eq('job_id', jobId)
      .eq('user_id', user.id)
      .not('dimensions', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error || !session) {
      return NextResponse.json(null)
    }

    return NextResponse.json({
      sessionId: session.id,
      score: session.score,
      recommendation: session.recommendation,
      analysis: session.analysis,
      dimensions: session.dimensions,
      provider: session.provider,
      model: session.model,
    })
  } catch (error) {
    console.error('Error in GET /api/jobs/[id]/analyze-v2:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// =====================================================
// 辅助函数：获取完整Profile
// =====================================================

async function fetchFullProfile(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
): Promise<FullProfile | null> {
  // 并行获取所有Profile数据
  const [
    profileResult,
    workResult,
    eduResult,
    skillsResult,
    projectsResult,
    certsResult,
  ] = await Promise.all([
    supabase.from('user_profiles').select('*').eq('user_id', userId).single(),
    supabase
      .from('work_experiences')
      .select('*')
      .eq('user_id', userId)
      .order('display_order'),
    supabase
      .from('education_records')
      .select('*')
      .eq('user_id', userId)
      .order('display_order'),
    supabase
      .from('user_skills')
      .select('*')
      .eq('user_id', userId)
      .order('display_order'),
    supabase
      .from('user_projects')
      .select('*')
      .eq('user_id', userId)
      .order('display_order'),
    supabase
      .from('user_certifications')
      .select('*')
      .eq('user_id', userId)
      .order('display_order'),
  ])

  return {
    profile: profileResult.data,
    work_experiences: workResult.data,
    education_records: eduResult.data,
    skills: skillsResult.data,
    projects: projectsResult.data,
    certifications: certsResult.data,
  }
}

// =====================================================
// 辅助函数：从简历数据构建Profile格式
// =====================================================

function buildProfileFromResume(resume: Record<string, unknown>): {
  fullName: string
  location?: string
  careerObjective?: string
  skills: Array<{ name: string; level?: string; category?: string }>
  workExperience: Array<{
    company: string
    position: string
    startDate: string
    endDate?: string
    isCurrent?: boolean
    description?: string
    achievements?: string[]
  }>
  education: Array<{
    institution: string
    degree: string
    major?: string
    startDate?: string
    endDate?: string
    gpa?: number
  }>
  projects: Array<{
    name: string
    description?: string
    technologies?: string[]
    highlights?: string[]
  }>
  certifications: Array<{
    name: string
    issuer?: string
    issueDate?: string
  }>
} {
  const content = (resume.content as Record<string, unknown>) || {}
  const personalInfo = (content.personal_info as Record<string, unknown>) || {}

  return {
    fullName:
      (personalInfo.fullName as string) ||
      (personalInfo.full_name as string) ||
      (resume.full_name as string) ||
      'Unknown',
    location:
      (personalInfo.location as string) || (resume.location as string),
    careerObjective:
      (content.careerObjective as string) ||
      (content.career_objective as string),
    skills: ((content.skills as unknown[]) || []).map((s: unknown) => {
      if (typeof s === 'string') return { name: s }
      const skill = s as Record<string, unknown>
      return {
        name: (skill.name as string) || '',
        level: skill.level as string | undefined,
        category: skill.category as string | undefined,
      }
    }),
    workExperience: ((content.workExperience as unknown[]) ||
      (content.work_experience as unknown[]) ||
      []) as Array<{
      company: string
      position: string
      startDate: string
      endDate?: string
      isCurrent?: boolean
      description?: string
      achievements?: string[]
    }>,
    education: ((content.education as unknown[]) || []) as Array<{
      institution: string
      degree: string
      major?: string
      startDate?: string
      endDate?: string
      gpa?: number
    }>,
    projects: ((content.projects as unknown[]) || []) as Array<{
      name: string
      description?: string
      technologies?: string[]
      highlights?: string[]
    }>,
    certifications: ((content.certifications as unknown[]) || []) as Array<{
      name: string
      issuer?: string
      issueDate?: string
    }>,
  }
}

// =====================================================
// 核心函数：执行8维度分析
// =====================================================

async function perform8DimensionAnalysis(
  job: Record<string, unknown>,
  profile: FullProfile | null,
  resume: Record<string, unknown> | null,
  provider?: AIProviderType,
  locale?: string
): Promise<JobMatchingV2Output> {
  try {
    // 构建profile数据
    let profileData: Parameters<typeof buildJobMatchingV2Prompt>[0]['profile']

    if (profile && profile.profile) {
      // 从Profile构建
      profileData = {
        fullName: profile.profile.full_name,
        location: profile.profile.location,
        careerObjective: profile.profile.professional_summary,
        skills: (profile.skills || []).map((s) => ({
          name: s.name,
          level: s.level,
          category: s.category,
        })),
        workExperience: (profile.work_experiences || []).map((w) => ({
          company: w.company,
          position: w.position,
          startDate: w.start_date,
          endDate: w.is_current ? undefined : w.end_date,
          isCurrent: w.is_current,
          description: w.description,
          achievements: w.achievements,
        })),
        education: (profile.education_records || []).map((e) => ({
          institution: e.institution,
          degree: e.degree,
          major: e.major,
          startDate: e.start_date,
          endDate: e.is_current ? undefined : e.end_date,
          gpa: e.gpa,
        })),
        projects: (profile.projects || []).map((p) => ({
          name: p.name,
          description: p.description,
          technologies: p.technologies,
          highlights: p.highlights,
        })),
        certifications: (profile.certifications || []).map((c) => ({
          name: c.name,
          issuer: c.issuer,
          issueDate: c.issue_date,
        })),
      }
    } else if (resume) {
      // 从简历构建
      profileData = buildProfileFromResume(resume)
    } else {
      throw new Error('No profile or resume data available')
    }

    // 构建Prompt
    const userPrompt = buildJobMatchingV2Prompt({
      job: {
        title: job.title as string,
        company: job.company as string,
        location: job.location as string | undefined,
        job_type: job.job_type as string | undefined,
        salary_min: job.salary_min as number | undefined,
        salary_max: job.salary_max as number | undefined,
        salary_currency: job.salary_currency as string | undefined,
        description: job.description as string | undefined,
        requirements: job.requirements as string | undefined,
        benefits: job.benefits as string | undefined,
      },
      profile: profileData,
    }, locale || 'zh')

    // 调用AI
    const aiClient = createAIClient(provider)
    const model = getBestModel(provider)

    const completion = await aiClient.chat.completions.create({
      model,
      messages: [
        {
          role: 'system',
          content: getJobMatchingV2SystemPrompt(locale || 'zh'),
        },
        {
          role: 'user',
          content: userPrompt,
        },
      ],
      temperature: TEMPERATURE_PRESETS.BALANCED,
      max_tokens: 16384, // V2需要更多token
    })

    const responseText = completion.choices[0].message.content
    if (!responseText) {
      throw new Error('AI provider returned empty response')
    }

    console.log('📝 Raw V2 AI response length:', responseText.length)

    // 解析V2响应
    const parsed = parseJobMatchingV2Output(responseText)

    if (parsed) {
      console.log('✅ Successfully parsed V2 response with dimensions')
      return parsed
    }

    // 如果解析失败，尝试降级处理
    console.warn('⚠️ V2 parsing failed, falling back to basic parsing')

    // 提取基本信息
    const scoreMatch = responseText.match(/---SCORE---\s*(\d+)/i)
    const score = scoreMatch ? parseInt(scoreMatch[1], 10) : 50

    const recMatch = responseText.match(
      /---RECOMMENDATION---\s*(strong_match|good_match|moderate_match|weak_match|not_recommended)/i
    )
    const recommendation = (recMatch?.[1] || 'moderate_match') as JobMatchingV2Output['recommendation']

    const analysisMatch = responseText.match(
      /---ANALYSIS---\s*([\s\S]*?)(?:---END---|$)/i
    )
    const analysis = analysisMatch?.[1]?.trim() || 'Analysis not available'

    // 生成默认CV策略
    const skillNames = profileData.skills?.map((s) => s.name) || []
    const defaultStrategy = generateDefaultCVStrategy(
      job.title as string,
      skillNames
    )

    return {
      score,
      recommendation,
      dimensions: {
        rolePositioning: {
          summary: `${job.title} at ${job.company}`,
          level: 'mid',
          domain: 'Unknown',
          primaryFunction: 'Unknown',
          candidateFit: {
            currentLevel: 'Unknown',
            targetLevel: 'Unknown',
            gap: 'Unable to determine',
            readiness: 'gap',
          },
        },
        coreResponsibilities: {
          responsibilities: [],
          coverageScore: 0,
          summary: 'Analysis incomplete',
        },
        keywordMatching: {
          keywords: [],
          requiredMatchRate: 0,
          overallMatchRate: 0,
          atsFriendliness: 'fair',
          suggestedAdditions: [],
        },
        keyRequirements: {
          requirements: [],
          mandatoryFulfillmentRate: 0,
          overallFulfillmentRate: 0,
          majorGaps: [],
          majorStrengths: [],
        },
        swotAnalysis: {
          strengths: [],
          weaknesses: [],
          opportunities: [],
          threats: [],
          overallAssessment: 'Analysis incomplete',
        },
        cvStrategy: defaultStrategy,
        interviewPreparation: {
          likelyQuestions: [],
          questionsToAsk: [],
          technicalReview: [],
          projectStories: [],
          tips: [],
        },
        matchScore: {
          overall: score,
          breakdown: {
            skillsScore: 0,
            experienceScore: 0,
            educationScore: 0,
            cultureFitScore: 0,
            careerFitScore: 0,
          },
          confidence: 'low',
          recommendation: recommendation,
          summary: 'Detailed analysis not available',
        },
      },
      analysis,
    }
  } catch (error) {
    handleAIError(error, provider)
    throw error
  }
}
