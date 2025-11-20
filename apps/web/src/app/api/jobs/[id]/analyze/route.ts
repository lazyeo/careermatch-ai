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
import type { AnalysisDimension, SWOTAnalysis, KeywordMatch } from '@careermatch/shared'

/**
 * POST /api/jobs/[id]/analyze
 *
 * Generates AI-powered job-resume match analysis
 * Body: { resumeId: string }
 * Returns: JobAnalysis
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if any AI provider is configured
    if (!isAnyAIConfigured()) {
      return NextResponse.json(
        {
          error: 'No AI provider is configured. Please add API keys to .env.local',
          hint: 'Supported providers: OpenAI, Codex (relay), Claude (relay), Gemini (relay)',
        },
        { status: 503 }
      )
    }

    // Get resume_id and optional provider from request body
    const body = await request.json()
    const { resumeId, provider } = body as { resumeId: string; provider?: AIProviderType }

    if (!resumeId) {
      return NextResponse.json(
        { error: 'resumeId is required' },
        { status: 400 }
      )
    }

    // Check if analysis already exists (cached)
    const { data: existingAnalysis } = await supabase
      .from('job_analyses')
      .select('*')
      .eq('job_id', params.id)
      .eq('resume_id', resumeId)
      .single()

    if (existingAnalysis) {
      console.log('✅ Returning cached analysis')
      return NextResponse.json(existingAnalysis)
    }

    // Fetch the job
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single()

    if (jobError || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    // Fetch the resume
    const { data: resume, error: resumeError } = await supabase
      .from('resumes')
      .select('*')
      .eq('id', resumeId)
      .eq('user_id', user.id)
      .single()

    if (resumeError || !resume) {
      return NextResponse.json({ error: 'Resume not found' }, { status: 404 })
    }

    // Get the provider info for logging
    const defaultProvider = getDefaultProvider()
    const providerName = provider
      ? provider.toUpperCase()
      : defaultProvider?.displayName || 'Unknown'

    console.log(`🤖 Calling ${providerName} for job matching analysis...`)

    // Call AI provider to perform analysis
    const analysisResult = await performAIAnalysis(job, resume, provider)

    // Save analysis to database
    const { data: savedAnalysis, error: saveError } = await supabase
      .from('job_analyses')
      .insert({
        job_id: params.id,
        resume_id: resumeId,
        match_score: analysisResult.matchScore,
        dimensions: analysisResult.dimensions,
        strengths: analysisResult.strengths,
        gaps: analysisResult.gaps,
        swot: analysisResult.swot,
        keywords: analysisResult.keywords,
      })
      .select()
      .single()

    if (saveError) {
      console.error('Error saving analysis:', saveError)
      return NextResponse.json(
        { error: 'Failed to save analysis' },
        { status: 500 }
      )
    }

    console.log('✅ Analysis completed and saved')
    return NextResponse.json(savedAnalysis)
  } catch (error) {
    console.error('Error in POST /api/jobs/[id]/analyze:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/jobs/[id]/analyze
 *
 * Retrieves existing analysis for a job and resume
 * Query: ?resumeId=xxx
 * Returns: JobAnalysis or null
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get resume_id from query params
    const { searchParams } = new URL(request.url)
    const resumeId = searchParams.get('resumeId')

    if (!resumeId) {
      return NextResponse.json(
        { error: 'resumeId query parameter is required' },
        { status: 400 }
      )
    }

    // Fetch existing analysis
    const { data: analysis, error } = await supabase
      .from('job_analyses')
      .select('*')
      .eq('job_id', params.id)
      .eq('resume_id', resumeId)
      .single()

    if (error) {
      // No analysis found
      return NextResponse.json(null)
    }

    return NextResponse.json(analysis)
  } catch (error) {
    console.error('Error in GET /api/jobs/[id]/analyze:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Perform AI analysis using configured AI provider
 */
async function performAIAnalysis(
  job: Record<string, unknown>,
  resume: Record<string, unknown>,
  provider?: AIProviderType
) {
  try {
    const prompt = buildAnalysisPrompt(job, resume)

    // Create AI client for the specified or default provider
    const aiClient = createAIClient(provider)
    const model = getBestModel(provider)

    console.log(`📊 Using model: ${model}`)

    const completion = await aiClient.chat.completions.create({
      model,
      messages: [
        {
          role: 'system',
          content: `You are an expert career advisor and ATS (Applicant Tracking System) specialist.
Your task is to analyze job-resume matches using a comprehensive 9-dimension framework.
Always respond with valid JSON only, no markdown or additional text.`,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: TEMPERATURE_PRESETS.ANALYTICAL,
      response_format: { type: 'json_object' },
    })

    const responseText = completion.choices[0].message.content
    if (!responseText) {
      throw new Error('AI provider returned empty response')
    }

    // Parse the JSON response
    const analysis = JSON.parse(responseText)

    return {
      matchScore: analysis.matchScore,
      dimensions: analysis.dimensions as AnalysisDimension[],
      strengths: analysis.strengths as string[],
      gaps: analysis.gaps as string[],
      swot: analysis.swot as SWOTAnalysis,
      keywords: analysis.keywords as KeywordMatch[],
    }
  } catch (error) {
    handleAIError(error, provider)
  }
}

/**
 * Build the analysis prompt for OpenAI
 */
function buildAnalysisPrompt(job: Record<string, unknown>, resume: Record<string, unknown>): string {
  return `
Analyze the match between this job posting and resume. Provide a comprehensive analysis in JSON format.

JOB POSTING:
- Title: ${job.title}
- Company: ${job.company}
- Location: ${job.location || 'Not specified'}
- Type: ${job.job_type || 'Not specified'}
- Description: ${job.description || 'Not provided'}
- Requirements: ${job.requirements || 'Not provided'}
- Benefits: ${job.benefits || 'Not provided'}

RESUME:
- Name: ${resume.full_name}
- Email: ${resume.email}
- Phone: ${resume.phone}
- Location: ${resume.location || 'Not specified'}
- Objective: ${resume.objective || 'Not provided'}
- Skills: ${JSON.stringify(resume.skills || [])}
- Work Experience: ${JSON.stringify(resume.work_experience || [])}
- Education: ${JSON.stringify(resume.education || [])}
- Projects: ${JSON.stringify(resume.projects || [])}
- Certifications: ${JSON.stringify(resume.certifications || [])}

Please analyze and return a JSON object with this exact structure:

{
  "matchScore": <number 0-100>,
  "dimensions": [
    {
      "name": "Role Alignment",
      "score": <number 0-100>,
      "description": "Brief explanation of how the candidate's experience aligns with the role"
    },
    {
      "name": "Skills Match",
      "score": <number 0-100>,
      "description": "Analysis of technical and soft skills alignment"
    },
    {
      "name": "Experience Level",
      "score": <number 0-100>,
      "description": "How the candidate's experience level matches requirements"
    },
    {
      "name": "Education Background",
      "score": <number 0-100>,
      "description": "Educational qualifications fit"
    },
    {
      "name": "Industry Fit",
      "score": <number 0-100>,
      "description": "Relevant industry experience and knowledge"
    },
    {
      "name": "Soft Skills",
      "score": <number 0-100>,
      "description": "Communication, teamwork, leadership potential"
    },
    {
      "name": "Cultural Fit",
      "score": <number 0-100>,
      "description": "Alignment with company values and culture (inferred)"
    },
    {
      "name": "Growth Potential",
      "score": <number 0-100>,
      "description": "Learning capacity and career development trajectory"
    },
    {
      "name": "Salary Expectation",
      "score": <number 0-100>,
      "description": "Alignment with offered compensation (if available)"
    }
  ],
  "strengths": [
    "List 3-5 main strengths of the candidate for this specific role"
  ],
  "gaps": [
    "List 3-5 areas where the candidate may need improvement or lacks requirements"
  ],
  "swot": {
    "strengths": ["Internal positive factors - 3-5 points"],
    "weaknesses": ["Internal limiting factors - 3-5 points"],
    "opportunities": ["External favorable factors - 3-5 points"],
    "threats": ["External challenges - 3-5 points"]
  },
  "keywords": [
    {
      "keyword": "Important skill or term from job description",
      "inResume": true/false,
      "importance": "high/medium/low",
      "context": "Where to add this keyword or how it's demonstrated"
    }
  ]
}

Ensure all scores are integers between 0-100. The overall matchScore should be a weighted average of all dimensions.
Focus on the New Zealand job market context.
`
}
