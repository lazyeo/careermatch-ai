/**
 * POST /api/internal/process-job
 * 
 * 后台 Worker - 执行完整的处理流程
 * 1. 更新任务状态为 'processing'
 * 2. 运行岗位分析 (analyze-v2)
 * 3. 生成简历 (generate-resume)
 * 4. 生成求职信 (cover-letter)
 * 5. 更新任务状态为 'completed' 并保存结果
 * 6. 如果出错，更新状态为 'failed' 并保存错误信息
 */

import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'
import {
  createAICompletion,
  TEMPERATURE_PRESETS,
  DEFAULT_MODEL,
} from '@/lib/ai-providers'
import {
  getJobMatchingV2SystemPrompt,
  buildJobMatchingV2Prompt,
  parseJobMatchingV2Output,
  generateDefaultCVStrategy,
  type JobMatchingV2Output,
} from '@/lib/ai/prompts/features/job-matching-v2'
import type { FullProfile } from '@careermatch/shared'

export async function POST(request: NextRequest) {
  let taskId: string | null = null
  
  try {
    // 解析请求参数
    const body = await request.json()
    taskId = body.taskId as string

    if (!taskId) {
      return NextResponse.json(
        { error: 'taskId is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // 获取任务信息
    const { data: task, error: taskError } = await supabase
      .from('processing_tasks')
      .select('*')
      .eq('id', taskId)
      .single()

    if (taskError || !task) {
      console.error(`Task ${taskId} not found:`, taskError)
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    console.log(`🚀 Starting background processing for task: ${taskId}`)

    // 更新任务状态为 processing
    await updateTaskStatus(supabase, taskId, 'processing', 'step_1_analyze')

    // Step 1: 执行岗位分析
    console.log('📊 Step 1: Running job analysis...')
    const analysisResult = await runJobAnalysis(
      supabase,
      task.job_id,
      task.user_id,
      task.resume_id
    )
    
    await updateTaskProgress(supabase, taskId, 'step_1_analyze')
    console.log(`✅ Analysis completed, session: ${analysisResult.sessionId}`)

    // Step 2: 生成简历
    console.log('📄 Step 2: Generating resume...')
    await updateTaskStatus(supabase, taskId, 'processing', 'step_2_resume')
    
    const resumeResult = await generateResume(
      supabase,
      analysisResult.sessionId,
      task.user_id
    )
    
    await updateTaskProgress(supabase, taskId, 'step_2_resume')
    console.log(`✅ Resume generated: ${resumeResult.resumeId}`)

    // Step 3: 生成求职信
    console.log('✉️ Step 3: Generating cover letter...')
    await updateTaskStatus(supabase, taskId, 'processing', 'step_3_cover_letter')
    
    const coverLetterResult = await generateCoverLetter(
      supabase,
      task.job_id,
      task.user_id
    )
    
    await updateTaskProgress(supabase, taskId, 'step_3_cover_letter')
    console.log(`✅ Cover letter generated: ${coverLetterResult.coverLetterId}`)

    // 所有步骤完成，更新任务状态
    const { error: completeError } = await supabase
      .from('processing_tasks')
      .update({
        status: 'completed',
        current_step: 'completed',
        completed_at: new Date().toISOString(),
        result: {
          analysisSessionId: analysisResult.sessionId,
          resumeId: resumeResult.resumeId,
          coverLetterId: coverLetterResult.coverLetterId,
          score: analysisResult.score,
          recommendation: analysisResult.recommendation,
        },
      })
      .eq('id', taskId)

    if (completeError) {
      console.error('Failed to mark task as completed:', completeError)
    }

    console.log(`🎉 Task ${taskId} completed successfully!`)

    return NextResponse.json({
      success: true,
      taskId,
      result: {
        analysisSessionId: analysisResult.sessionId,
        resumeId: resumeResult.resumeId,
        coverLetterId: coverLetterResult.coverLetterId,
      },
    })
  } catch (error) {
    console.error('Error in background processing:', error)

    // 更新任务状态为 failed
    if (taskId) {
      const supabase = await createClient()
      await supabase
        .from('processing_tasks')
        .update({
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'Unknown error',
          completed_at: new Date().toISOString(),
        })
        .eq('id', taskId)
    }

    return NextResponse.json(
      {
        error: 'Background processing failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// =====================================================
// 辅助函数
// =====================================================

/**
 * 更新任务状态
 */
async function updateTaskStatus(
  supabase: Awaited<ReturnType<typeof createClient>>,
  taskId: string,
  status: string,
  currentStep: string
) {
  const { error } = await supabase
    .from('processing_tasks')
    .update({
      status,
      current_step: currentStep,
      updated_at: new Date().toISOString(),
    })
    .eq('id', taskId)

  if (error) {
    console.error(`Failed to update task status to ${status}:`, error)
    throw new Error(`Failed to update task status: ${error.message}`)
  }
}

/**
 * 更新任务进度（添加已完成的步骤）
 */
async function updateTaskProgress(
  supabase: Awaited<ReturnType<typeof createClient>>,
  taskId: string,
  completedStep: string
) {
  // 获取当前任务
  const { data: task } = await supabase
    .from('processing_tasks')
    .select('steps_completed')
    .eq('id', taskId)
    .single()

  const stepsCompleted = [...(task?.steps_completed || []), completedStep]

  const { error } = await supabase
    .from('processing_tasks')
    .update({
      steps_completed: stepsCompleted,
      updated_at: new Date().toISOString(),
    })
    .eq('id', taskId)

  if (error) {
    console.error('Failed to update task progress:', error)
  }
}

/**
 * 执行岗位分析 (复用 analyze-v2 逻辑)
 */
async function runJobAnalysis(
  supabase: Awaited<ReturnType<typeof createClient>>,
  jobId: string,
  userId: string,
  resumeId: string | null
): Promise<{
  sessionId: string
  score: number
  recommendation: string
}> {
  // 获取岗位信息
  const { data: job, error: jobError } = await supabase
    .from('jobs')
    .select('*')
    .eq('id', jobId)
    .eq('user_id', userId)
    .single()

  if (jobError || !job) {
    throw new Error('Job not found')
  }

  // 获取 Profile 数据（推荐）或简历数据
  let profileData: FullProfile | null = null

  if (!resumeId) {
    // 使用 Profile 数据
    profileData = await fetchFullProfile(supabase, userId)
    if (!profileData || !profileData.profile) {
      throw new Error('Profile not found. Please complete your profile first.')
    }
  } else {
    throw new Error('Resume-based analysis not yet implemented in worker')
  }

  // 执行 8 维度分析
  const analysisResult = await perform8DimensionAnalysis(job, profileData)

  // 保存到数据库
  const { data: savedSession, error: saveError } = await supabase
    .from('analysis_sessions')
    .insert({
      job_id: jobId,
      resume_id: resumeId || null,
      user_id: userId,
      status: 'active',
      score: analysisResult.score,
      recommendation: analysisResult.recommendation,
      analysis: analysisResult.analysis,
      dimensions: analysisResult.dimensions,
      provider: 'relay',
      model: DEFAULT_MODEL,
    })
    .select()
    .single()

  if (saveError) {
    throw new Error(`Failed to save analysis session: ${saveError.message}`)
  }

  return {
    sessionId: savedSession.id,
    score: savedSession.score,
    recommendation: savedSession.recommendation,
  }
}

/**
 * 获取完整 Profile
 */
async function fetchFullProfile(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
): Promise<FullProfile | null> {
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

/**
 * 执行 8 维度分析 (核心逻辑)
 */
async function perform8DimensionAnalysis(
  job: Record<string, unknown>,
  profile: FullProfile
): Promise<JobMatchingV2Output> {
  // Validate profile data
  if (!profile.profile) {
    throw new Error('Profile data is missing')
  }

  // 构建 profile 数据
  const profileData = {
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

  // 构建 Prompt
  const userPrompt = buildJobMatchingV2Prompt(
    {
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
    },
    'zh'
  )

  // 调用 AI
  const response = await createAICompletion({
    messages: [
      {
        role: 'system',
        content: getJobMatchingV2SystemPrompt('zh'),
      },
      {
        role: 'user',
        content: userPrompt,
      },
    ],
    temperature: TEMPERATURE_PRESETS.BALANCED,
    maxTokens: 16384,
  })

  const responseText = response.content
  if (!responseText) {
    throw new Error('AI provider returned empty response')
  }

  // 解析 V2 响应
  const parsed = parseJobMatchingV2Output(responseText)

  if (parsed) {
    return parsed
  }

  // 降级处理
  console.warn('⚠️ V2 parsing failed, using fallback')
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
}

/**
 * 生成简历 (复用 generate-from-analysis 逻辑的简化版本)
 */
async function generateResume(
  supabase: Awaited<ReturnType<typeof createClient>>,
  sessionId: string,
  userId: string
): Promise<{ resumeId: string }> {
  // 获取分析会话
  const { data: session, error: sessionError } = await supabase
    .from('analysis_sessions')
    .select('*')
    .eq('id', sessionId)
    .eq('user_id', userId)
    .single()

  if (sessionError || !session) {
    throw new Error('Analysis session not found')
  }

  // 获取岗位信息
  const { data: job, error: jobError } = await supabase
    .from('jobs')
    .select('*')
    .eq('id', session.job_id)
    .eq('user_id', userId)
    .single()

  if (jobError || !job) {
    throw new Error('Job not found')
  }

  // 获取 Profile
  const profile = await fetchFullProfile(supabase, userId)
  if (!profile || !profile.profile) {
    throw new Error('Profile not found')
  }

  // 构建简历生成 Prompt（简化版）
  const prompt = buildSimpleResumePrompt(job, profile, session.analysis)

  // 调用 AI 生成简历
  const response = await createAICompletion({
    messages: [
      {
        role: 'system',
        content: 'You are a professional resume writer. Generate a complete resume in JSON format based on the provided information. All content must be in English.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: TEMPERATURE_PRESETS.ANALYTICAL,
    maxTokens: 8192,
  })

  let resumeContent: Record<string, unknown>
  try {
    // 简单的 JSON 解析（移除可能的 markdown 代码块）
    const cleaned = response.content
      .replace(/```json\s*/g, '')
      .replace(/```\s*/g, '')
      .trim()
    resumeContent = JSON.parse(cleaned)
  } catch (parseError) {
    console.error('Failed to parse resume JSON:', parseError)
    throw new Error('Invalid resume format generated')
  }

  // 保存简历
  const resumeTitle = `Resume - ${job.title} at ${job.company}`
  
  // 检查是否已有简历
  const { data: existingResume } = await supabase
    .from('resumes')
    .select('id, version')
    .eq('job_id', session.job_id)
    .eq('user_id', userId)
    .single()

  let resume
  if (existingResume) {
    // 更新现有简历
    const { data: updatedResume, error: updateError } = await supabase
      .from('resumes')
      .update({
        title: resumeTitle,
        content: resumeContent,
        analysis_session_id: session.id,
        source: 'ai_generated',
        version: (existingResume.version || 1) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existingResume.id)
      .select()
      .single()

    if (updateError) {
      throw new Error(`Failed to update resume: ${updateError.message}`)
    }
    resume = updatedResume
  } else {
    // 创建新简历
    const { data: newResume, error: saveError } = await supabase
      .from('resumes')
      .insert({
        user_id: userId,
        title: resumeTitle,
        content: resumeContent,
        job_id: session.job_id,
        analysis_session_id: session.id,
        source: 'ai_generated',
        version: 1,
        is_primary: false,
      })
      .select()
      .single()

    if (saveError) {
      throw new Error(`Failed to save resume: ${saveError.message}`)
    }
    resume = newResume
  }

  return { resumeId: resume.id }
}

/**
 * 构建简化的简历生成 Prompt
 */
function buildSimpleResumePrompt(
  job: Record<string, unknown>,
  profile: FullProfile,
  analysisContent: string
): string {
  if (!profile.profile) {
    throw new Error('Profile data is missing')
  }

  return `Generate a professional resume for this job application.

**Job Details:**
- Title: ${job.title}
- Company: ${job.company}
- Description: ${job.description || 'N/A'}

**AI Analysis Suggestions:**
${analysisContent}

**Candidate Profile:**
- Name: ${profile.profile.full_name}
- Location: ${profile.profile.location}
- Summary: ${profile.profile.professional_summary}
- Work Experience: ${profile.work_experiences?.length || 0} positions
- Education: ${profile.education_records?.length || 0} degrees
- Skills: ${profile.skills?.length || 0} skills
- Projects: ${profile.projects?.length || 0} projects

Please generate a complete resume in JSON format with the following structure:
{
  "personal_info": { "full_name": "", "email": "", "phone": "", "location": "" },
  "professional_summary": "",
  "work_experience": [{ "company": "", "position": "", "start_date": "", "end_date": "", "achievements": [] }],
  "education": [{ "institution": "", "degree": "", "field": "", "start_date": "", "end_date": "" }],
  "skills": { "technical": [], "soft": [] },
  "projects": [{ "name": "", "description": "", "technologies": [] }]
}

All content must be in English. Focus on achievements relevant to the target job.`
}

/**
 * 生成求职信（简化版）
 */
async function generateCoverLetter(
  supabase: Awaited<ReturnType<typeof createClient>>,
  jobId: string,
  userId: string
): Promise<{ coverLetterId: string }> {
  // 获取岗位信息
  const { data: job, error: jobError } = await supabase
    .from('jobs')
    .select('*')
    .eq('id', jobId)
    .eq('user_id', userId)
    .single()

  if (jobError || !job) {
    throw new Error('Job not found')
  }

  // 获取用户 Profile
  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (profileError || !profile) {
    throw new Error('Profile not found')
  }

  // 构建求职信生成 Prompt
  const prompt = `Generate a professional cover letter for this job application.

**Job:**
- Title: ${job.title}
- Company: ${job.company}
- Description: ${job.description || 'N/A'}

**Candidate:**
- Name: ${profile.full_name}
- Summary: ${profile.professional_summary || 'N/A'}

Please write a concise, professional cover letter (3-4 paragraphs) in English.
Output as JSON: { "content": "cover letter text here" }`

  // 调用 AI
  const response = await createAICompletion({
    messages: [
      {
        role: 'system',
        content: 'You are a professional cover letter writer. Write compelling, personalized cover letters.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: TEMPERATURE_PRESETS.BALANCED,
    maxTokens: 2048,
  })

  let coverLetterContent: string
  try {
    const cleaned = response.content
      .replace(/```json\s*/g, '')
      .replace(/```\s*/g, '')
      .trim()
    const parsed = JSON.parse(cleaned)
    coverLetterContent = parsed.content || response.content
  } catch {
    // 如果解析失败，直接使用响应内容
    coverLetterContent = response.content
  }

  // 保存求职信
  const title = `Cover Letter - ${job.title} at ${job.company}`
  const { data: savedCoverLetter, error: saveError } = await supabase
    .from('cover_letters')
    .insert({
      user_id: userId,
      job_id: jobId,
      title,
      content: coverLetterContent,
      source: 'ai_generated',
    })
    .select()
    .single()

  if (saveError) {
    throw new Error(`Failed to save cover letter: ${saveError.message}`)
  }

  return { coverLetterId: savedCoverLetter.id }
}
