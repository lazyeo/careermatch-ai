import { createClient } from '@/lib/supabase-server'
import {
  createAIClient,
  isAnyAIConfigured,
  getBestModel,
  TEMPERATURE_PRESETS,
  handleAIError,
  type AIProviderType,
} from '@/lib/ai-providers'
import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/jobs/[id]/analyze/optimize
 *
 * AI优化简历 - 基于分析结果自动优化简历内容
 * Body: { sessionId: string, resumeId: string, provider?: AIProviderType }
 * Returns: { optimizedContent: ResumeContent, suggestions: string[] }
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
        { error: 'No AI provider is configured' },
        { status: 503 }
      )
    }

    // Get request body
    const body = await request.json()
    const { sessionId, resumeId, provider } = body as {
      sessionId: string
      resumeId: string
      provider?: AIProviderType
    }

    if (!sessionId || !resumeId) {
      return NextResponse.json(
        { error: 'sessionId and resumeId are required' },
        { status: 400 }
      )
    }

    // Fetch the analysis session
    const { data: session, error: sessionError } = await supabase
      .from('analysis_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .single()

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
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

    // Get provider and model
    const model = getBestModel(provider)
    console.log(`🔧 Optimizing resume with ${provider?.toUpperCase() || 'DEFAULT'} (${model})`)

    // Build optimization prompt
    const prompt = buildOptimizationPrompt(job, resume, session)

    // Call AI
    const aiClient = createAIClient(provider)

    const completion = await aiClient.chat.completions.create({
      model,
      messages: [
        {
          role: 'system',
          content: `You are a professional resume optimization expert.
You will optimize the resume content based on the previous AI analysis report to make it more competitive for the target job.
You need to return a JSON object containing optimizedContent (optimized resume content) and changes (summary of major changes).

**CRITICAL REQUIREMENT**:
All content in the optimized resume MUST be in **ENGLISH**. Even if the input is in another language, you must translate and adapt it to professional English.`,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: TEMPERATURE_PRESETS.BALANCED,
      response_format: { type: 'json_object' },
    })

    const responseText = completion.choices[0].message.content
    if (!responseText) {
      throw new Error('AI returned empty response')
    }

    console.log('📝 Optimization response length:', responseText.length)

    // Parse response
    const result = parseOptimizationResponse(responseText, resume.content)

    console.log('✅ Resume optimization completed')

    return NextResponse.json({
      optimizedContent: result.optimizedContent,
      changes: result.changes,
      originalContent: resume.content,
    })
  } catch (error) {
    console.error('Error in POST /api/jobs/[id]/analyze/optimize:', error)

    if (error instanceof Error) {
      handleAIError(error)
    }

    return NextResponse.json(
      { error: 'Failed to optimize resume' },
      { status: 500 }
    )
  }
}

/**
 * Build optimization prompt
 */
function buildOptimizationPrompt(
  job: Record<string, unknown>,
  resume: Record<string, unknown>,
  session: Record<string, unknown>
): string {
  const resumeContent = resume.content as Record<string, unknown> || {}

  return `
## Task
Optimize the candidate's resume based on the following AI analysis report to better match the target job.

**IMPORTANT**: The output resume content MUST be in ENGLISH.

## Target Job
- Title: ${job.title}
- Company: ${job.company}
- Requirements: ${job.requirements || 'Not provided'}
- Description: ${job.description || 'Not provided'}

## Current Resume Content
${JSON.stringify(resumeContent, null, 2)}

## AI Analysis Report
Match Score: ${session.score}/100
Recommendation: ${session.recommendation}

Analysis Content:
${session.analysis}

## Optimization Requirements

1. **Authenticity**: Optimize expression and structure only, do not fabricate information.
2. **Relevance**: Highlight skills and experience relevant to the job requirements.
3. **Quantification**: Use numbers and specific results to describe work experience.
4. **Keywords**: Use keywords from the job description.
5. **Structure**: Adjust the order to place the most relevant information first.
6. **ENGLISH ONLY**: Ensure all optimized content is in professional English.

## Output Format

Please return the following JSON format:

{
  "optimizedContent": {
    "personal_info": {
      "fullName": "姓名",
      "email": "邮箱",
      "phone": "电话",
      "location": "地点",
      "linkedin": "LinkedIn链接（可选）",
      "website": "个人网站（可选）"
    },
    "careerObjective": "优化后的求职目标（针对该岗位定制）",
    "skills": [
      { "name": "技能名称", "level": "expert|advanced|intermediate|beginner", "category": "类别" }
    ],
    "workExperience": [
      {
        "company": "公司名",
        "position": "职位",
        "startDate": "开始日期",
        "endDate": "结束日期",
        "description": "优化后的工作描述（突出相关成就）",
        "highlights": ["优化后的亮点1", "优化后的亮点2"]
      }
    ],
    "education": [
      {
        "school": "学校",
        "degree": "学位",
        "field": "专业",
        "startDate": "开始日期",
        "endDate": "结束日期",
        "gpa": "GPA（可选）"
      }
    ],
    "projects": [
      {
        "name": "项目名称",
        "description": "优化后的项目描述（突出与岗位相关的技术和成果）",
        "technologies": ["技术1", "技术2"],
        "url": "项目链接（可选）"
      }
    ],
    "certifications": [
      {
        "name": "证书名称",
        "issuer": "颁发机构",
        "date": "日期"
      }
    ]
  },
  "changes": [
    "Major change 1: Explain what was changed",
    "Major change 2: Explain what was changed",
    "Major change 3: Explain what was changed"
  ]
}

Ensure optimizedContent maintains the original resume's factual information, only optimizing expression and structure.
`
}

/**
 * Parse optimization response
 */
function parseOptimizationResponse(
  responseText: string,
  originalContent: unknown
): { optimizedContent: unknown; changes: string[] } {
  // Clean the response - remove markdown code blocks
  let cleaned = responseText.trim()

  // Remove markdown code blocks (```json ... ```)
  if (cleaned.includes('```')) {
    const codeBlockMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
    if (codeBlockMatch) {
      cleaned = codeBlockMatch[1].trim()
    } else {
      // Just remove all ``` markers
      cleaned = cleaned.replace(/```(?:json)?/gi, '').trim()
    }
  }

  // Extract JSON if there's text before it
  const firstBrace = cleaned.indexOf('{')
  const lastBrace = cleaned.lastIndexOf('}')
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1)
  }

  try {
    const result = JSON.parse(cleaned)

    if (result.optimizedContent && Array.isArray(result.changes)) {
      console.log('✅ Successfully parsed optimization response')
      return result
    }

    // If missing changes, provide default
    if (result.optimizedContent) {
      console.log('✅ Parsed optimization response (added default changes)')
      return {
        optimizedContent: result.optimizedContent,
        changes: ['简历内容已根据AI分析建议进行优化'],
      }
    }
  } catch (e) {
    console.log('📝 Failed to parse optimization response:', e)
  }

  // Fallback: return original content with no changes
  return {
    optimizedContent: originalContent,
    changes: ['优化失败，返回原始简历内容'],
  }
}
