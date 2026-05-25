import type { SupabaseClient } from '@supabase/supabase-js'

import {
  createAICompletion,
  TEMPERATURE_PRESETS,
} from '@/lib/ai-providers'
import {
  runAutomaticJobAnalysis,
  type AutomaticJobAnalysisResult,
} from '@/lib/jobs/run-job-analysis'
import type { FullProfile } from '@careermatch/shared'

type DbClient = SupabaseClient

export type ProcessJobMode = 'analysis_only' | 'full_artifacts'

export type ProcessJobTaskResult = {
  analysisSessionId: string
  score: number
  recommendation: string
  resumeId?: string
  coverLetterId?: string
}

export async function processJobTask(
  supabase: DbClient,
  {
    taskId,
    mode = 'full_artifacts',
  }: {
    taskId: string
    mode?: ProcessJobMode
  }
): Promise<ProcessJobTaskResult> {
  const { data: task, error: taskError } = await supabase
    .from('processing_tasks')
    .select('*')
    .eq('id', taskId)
    .single()

  if (taskError || !task) {
    throw new Error('Task not found')
  }

  await updateTaskStatus(supabase, taskId, 'processing', 'step_1_analyze')

  const analysisResult = await runJobAnalysis(supabase, {
    taskId,
    jobId: task.job_id,
    userId: task.user_id,
    resumeId: task.resume_id,
  })

  await updateTaskProgress(supabase, taskId, 'step_1_analyze')

  if (mode === 'analysis_only') {
    await completeTask(supabase, taskId, {
      analysisSessionId: analysisResult.analysisSessionId,
      score: analysisResult.score,
      recommendation: analysisResult.recommendation,
    })

    return analysisResult
  }

  await updateTaskStatus(supabase, taskId, 'processing', 'step_2_resume')
  const resumeResult = await generateResumeForAnalysis(supabase, {
    analysisSessionId: analysisResult.analysisSessionId,
    userId: task.user_id,
  })
  await updateTaskProgress(supabase, taskId, 'step_2_resume')

  await updateTaskStatus(supabase, taskId, 'processing', 'step_3_cover_letter')
  const coverLetterResult = await generateCoverLetterForAnalysis(supabase, {
    jobId: task.job_id,
    userId: task.user_id,
    analysisSessionId: analysisResult.analysisSessionId,
  })
  await updateTaskProgress(supabase, taskId, 'step_3_cover_letter')

  const result = {
    analysisSessionId: analysisResult.analysisSessionId,
    resumeId: resumeResult.resumeId,
    coverLetterId: coverLetterResult.coverLetterId,
    score: analysisResult.score,
    recommendation: analysisResult.recommendation,
  }

  await completeTask(supabase, taskId, result)

  await supabase
    .from('jobs')
    .update({
      autoprocess_status: 'artifacts_completed',
      updated_at: new Date().toISOString(),
    })
    .eq('id', task.job_id)
    .eq('user_id', task.user_id)

  return result
}

export async function generateJobArtifacts(
  supabase: DbClient,
  {
    jobId,
    userId,
    analysisSessionId,
  }: {
    jobId: string
    userId: string
    analysisSessionId: string
  }
) {
  const resumeResult = await generateResumeForAnalysis(supabase, {
    analysisSessionId,
    userId,
  })
  const coverLetterResult = await generateCoverLetterForAnalysis(supabase, {
    jobId,
    userId,
    analysisSessionId,
  })

  await supabase
    .from('jobs')
    .update({
      autoprocess_status: 'artifacts_completed',
      recommended_next_action: 'generate_resume',
      updated_at: new Date().toISOString(),
    })
    .eq('id', jobId)
    .eq('user_id', userId)

  return {
    resumeId: resumeResult.resumeId,
    coverLetterId: coverLetterResult.coverLetterId,
  }
}

export async function markProcessJobTaskFailed(
  supabase: DbClient,
  taskId: string,
  error: unknown
) {
  await supabase
    .from('processing_tasks')
    .update({
      status: 'failed',
      current_step: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      completed_at: new Date().toISOString(),
    })
    .eq('id', taskId)
}

async function runJobAnalysis(
  supabase: DbClient,
  payload: {
    taskId: string
    jobId: string
    userId: string
    resumeId: string | null
  }
): Promise<AutomaticJobAnalysisResult> {
  return runAutomaticJobAnalysis(supabase, payload)
}

async function updateTaskStatus(
  supabase: DbClient,
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
    throw new Error(`Failed to update task status: ${error.message}`)
  }
}

async function updateTaskProgress(
  supabase: DbClient,
  taskId: string,
  completedStep: string
) {
  const { data: task } = await supabase
    .from('processing_tasks')
    .select('steps_completed')
    .eq('id', taskId)
    .single()

  const stepsCompleted = [...(task?.steps_completed || []), completedStep]

  await supabase
    .from('processing_tasks')
    .update({
      steps_completed: stepsCompleted,
      updated_at: new Date().toISOString(),
    })
    .eq('id', taskId)
}

async function completeTask(
  supabase: DbClient,
  taskId: string,
  result: ProcessJobTaskResult
) {
  const { error } = await supabase
    .from('processing_tasks')
    .update({
      status: 'completed',
      current_step: 'completed',
      completed_at: new Date().toISOString(),
      result,
    })
    .eq('id', taskId)

  if (error) {
    throw new Error(`Failed to mark task as completed: ${error.message}`)
  }
}

async function fetchFullProfile(
  supabase: DbClient,
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

export async function generateResumeForAnalysis(
  supabase: DbClient,
  {
    analysisSessionId,
    userId,
  }: {
    analysisSessionId: string
    userId: string
  }
): Promise<{ resumeId: string }> {
  const { data: session, error: sessionError } = await supabase
    .from('analysis_sessions')
    .select('*')
    .eq('id', analysisSessionId)
    .eq('user_id', userId)
    .single()

  if (sessionError || !session) {
    throw new Error('Analysis session not found')
  }

  const { data: job, error: jobError } = await supabase
    .from('jobs')
    .select('*')
    .eq('id', session.job_id)
    .eq('user_id', userId)
    .single()

  if (jobError || !job) {
    throw new Error('Job not found')
  }

  const profile = await fetchFullProfile(supabase, userId)
  if (!profile?.profile) {
    throw new Error('Profile not found')
  }

  const response = await createAICompletion({
    messages: [
      {
        role: 'system',
        content:
          'You are a professional resume writer. Generate a complete resume in JSON format based on the provided information. All content must be in English.',
      },
      {
        role: 'user',
        content: buildSimpleResumePrompt(job, profile, session.analysis),
      },
    ],
    temperature: TEMPERATURE_PRESETS.ANALYTICAL,
    maxTokens: 8192,
  })

  let resumeContent: Record<string, unknown>
  try {
    resumeContent = JSON.parse(
      response.content.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
    )
  } catch {
    throw new Error('Invalid resume format generated')
  }

  const resumeTitle = `Resume - ${job.title} at ${job.company}`
  const { data: existingResume } = await supabase
    .from('resumes')
    .select('id, version')
    .eq('job_id', session.job_id)
    .eq('user_id', userId)
    .single()

  if (existingResume) {
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
      .select('id')
      .single()

    if (updateError || !updatedResume) {
      throw new Error(updateError?.message || 'Failed to update resume')
    }

    return { resumeId: updatedResume.id }
  }

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
    .select('id')
    .single()

  if (saveError || !newResume) {
    throw new Error(saveError?.message || 'Failed to save resume')
  }

  return { resumeId: newResume.id }
}

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

export async function generateCoverLetterForAnalysis(
  supabase: DbClient,
  {
    jobId,
    userId,
    analysisSessionId,
  }: {
    jobId: string
    userId: string
    analysisSessionId: string
  }
): Promise<{ coverLetterId: string }> {
  const { data: job, error: jobError } = await supabase
    .from('jobs')
    .select('*')
    .eq('id', jobId)
    .eq('user_id', userId)
    .single()

  if (jobError || !job) {
    throw new Error('Job not found')
  }

  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (profileError || !profile) {
    throw new Error('Profile not found')
  }

  const response = await createAICompletion({
    messages: [
      {
        role: 'system',
        content:
          'You are a professional cover letter writer. Write compelling, personalized cover letters.',
      },
      {
        role: 'user',
        content: `Generate a professional cover letter for this job application.

**Job:**
- Title: ${job.title}
- Company: ${job.company}
- Description: ${job.description || 'N/A'}

**Candidate:**
- Name: ${profile.full_name}
- Summary: ${profile.professional_summary || 'N/A'}

Please write a concise, professional cover letter (3-4 paragraphs) in English.
Output as JSON: { "content": "cover letter text here" }`,
      },
    ],
    temperature: TEMPERATURE_PRESETS.BALANCED,
    maxTokens: 2048,
  })

  let coverLetterContent: string
  try {
    const parsed = JSON.parse(
      response.content.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
    )
    coverLetterContent = parsed.content || response.content
  } catch {
    coverLetterContent = response.content
  }

  const { data: savedCoverLetter, error: saveError } = await supabase
    .from('cover_letters')
    .insert({
      user_id: userId,
      job_id: jobId,
      analysis_session_id: analysisSessionId,
      title: `Cover Letter - ${job.title} at ${job.company}`,
      content: coverLetterContent,
      source: 'ai_generated',
    })
    .select('id')
    .single()

  if (saveError || !savedCoverLetter) {
    throw new Error(saveError?.message || 'Failed to save cover letter')
  }

  return { coverLetterId: savedCoverLetter.id }
}
