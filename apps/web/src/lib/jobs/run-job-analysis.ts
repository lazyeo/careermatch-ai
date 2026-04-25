import type { SupabaseClient } from '@supabase/supabase-js'

import {
  createAICompletion,
  DEFAULT_MODEL,
  TEMPERATURE_PRESETS,
} from '../ai-providers'
import {
  buildJobMatchingV2Prompt,
  generateDefaultCVStrategy,
  getJobMatchingV2SystemPrompt,
  parseJobMatchingV2Output,
  type JobMatchingV2Output,
} from '../ai/prompts/features/job-matching-v2'
import type { AutomaticJobAnalysisSource, FullProfile } from '@careermatch/shared'

export type AutomaticJobAnalysisPayload = {
  taskId: string
  userId: string
  jobId: string
  resumeId: string | null
  source: AutomaticJobAnalysisSource
}

export type AutomaticJobAnalysisResult = {
  analysisSessionId: string
  score: number
  recommendation: string
}

type DbClient = SupabaseClient<any>

export async function processAutomaticJobAnalysisTask(
  supabase: DbClient,
  payload: AutomaticJobAnalysisPayload
): Promise<AutomaticJobAnalysisResult> {
  await supabase
    .from('processing_tasks')
    .update({
      status: 'processing',
      current_step: 'analyzing',
      error: null,
      started_at: new Date().toISOString(),
    })
    .eq('id', payload.taskId)

  try {
    const result = await runAutomaticJobAnalysis(supabase, payload)

    await supabase
      .from('processing_tasks')
      .update({
        status: 'completed',
        current_step: 'completed',
        steps_completed: ['analysis'],
        completed_at: new Date().toISOString(),
        result: {
          analysisSessionId: result.analysisSessionId,
          score: result.score,
          recommendation: result.recommendation,
        },
      })
      .eq('id', payload.taskId)

    return result
  } catch (error) {
    await supabase
      .from('processing_tasks')
      .update({
        status: 'failed',
        current_step: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        completed_at: new Date().toISOString(),
      })
      .eq('id', payload.taskId)

    throw error
  }
}

export async function runAutomaticJobAnalysis(
  supabase: DbClient,
  payload: Pick<AutomaticJobAnalysisPayload, 'jobId' | 'userId' | 'resumeId'>
): Promise<AutomaticJobAnalysisResult> {
  const { data: job, error: jobError } = await supabase
    .from('jobs')
    .select('*')
    .eq('id', payload.jobId)
    .eq('user_id', payload.userId)
    .single()

  if (jobError || !job) {
    throw new Error('Job not found')
  }

  if (payload.resumeId) {
    throw new Error('Resume-based automatic analysis is not implemented yet')
  }

  const profileData = await fetchFullProfile(supabase, payload.userId)
  if (!profileData?.profile) {
    throw new Error('Profile not found. Please complete your profile first.')
  }

  const analysisResult = await perform8DimensionAnalysis(job, profileData)

  const { data: savedSession, error: saveError } = await supabase
    .from('analysis_sessions')
    .insert({
      job_id: payload.jobId,
      resume_id: null,
      user_id: payload.userId,
      status: 'active',
      score: analysisResult.score,
      recommendation: analysisResult.recommendation,
      analysis: analysisResult.analysis,
      dimensions: analysisResult.dimensions,
      provider: 'trigger',
      model: DEFAULT_MODEL,
    })
    .select('id, score, recommendation')
    .single()

  if (saveError || !savedSession) {
    throw new Error(saveError?.message || 'Failed to save analysis session')
  }

  return {
    analysisSessionId: savedSession.id,
    score: savedSession.score,
    recommendation: savedSession.recommendation,
  }
}

async function fetchFullProfile(
  supabase: DbClient,
  userId: string
): Promise<FullProfile | null> {
  const [profileResult, workResult, eduResult, skillsResult, projectsResult, certsResult] =
    await Promise.all([
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
      supabase.from('user_skills').select('*').eq('user_id', userId).order('display_order'),
      supabase.from('user_projects').select('*').eq('user_id', userId).order('display_order'),
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

async function perform8DimensionAnalysis(
  job: Record<string, unknown>,
  profile: FullProfile
): Promise<JobMatchingV2Output> {
  if (!profile.profile) {
    throw new Error('Profile data is missing')
  }

  const profileData = {
    fullName: profile.profile.full_name,
    location: profile.profile.location,
    careerObjective: profile.profile.professional_summary,
    skills: (profile.skills || []).map((skill) => ({
      name: skill.name,
      level: skill.level,
      category: skill.category,
    })),
    workExperience: (profile.work_experiences || []).map((work) => ({
      company: work.company,
      position: work.position,
      startDate: work.start_date,
      endDate: work.is_current ? undefined : work.end_date,
      isCurrent: work.is_current,
      description: work.description,
      achievements: work.achievements,
    })),
    education: (profile.education_records || []).map((education) => ({
      institution: education.institution,
      degree: education.degree,
      major: education.major,
      startDate: education.start_date,
      endDate: education.is_current ? undefined : education.end_date,
      gpa: education.gpa,
    })),
    projects: (profile.projects || []).map((project) => ({
      name: project.name,
      description: project.description,
      technologies: project.technologies,
      highlights: project.highlights,
    })),
    certifications: (profile.certifications || []).map((certification) => ({
      name: certification.name,
      issuer: certification.issuer,
      issueDate: certification.issue_date,
    })),
  }

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

  const response = await createAICompletion({
    messages: [
      { role: 'system', content: getJobMatchingV2SystemPrompt('zh') },
      { role: 'user', content: userPrompt },
    ],
    temperature: TEMPERATURE_PRESETS.BALANCED,
    maxTokens: 16384,
  })

  const responseText = response.content
  if (!responseText) {
    throw new Error('AI provider returned empty response')
  }

  const parsed = parseJobMatchingV2Output(responseText)
  if (parsed) {
    return parsed
  }

  const scoreMatch = responseText.match(/---SCORE---\s*(\d+)/i)
  const score = scoreMatch ? parseInt(scoreMatch[1], 10) : 50
  const recMatch = responseText.match(
    /---RECOMMENDATION---\s*(strong_match|good_match|moderate_match|weak_match|not_recommended)/i
  )
  const recommendation = (recMatch?.[1] || 'moderate_match') as JobMatchingV2Output['recommendation']
  const analysisMatch = responseText.match(/---ANALYSIS---\s*([\s\S]*?)(?:---END---|$)/i)
  const analysis = analysisMatch?.[1]?.trim() || 'Analysis not available'

  const defaultStrategy = generateDefaultCVStrategy(
    job.title as string,
    profileData.skills.map((skill) => skill.name)
  )

  return {
    score,
    recommendation,
    analysis,
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
        recommendation,
        summary: 'Detailed analysis not available',
      },
    },
  }
}
