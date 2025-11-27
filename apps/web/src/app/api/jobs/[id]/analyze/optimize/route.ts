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
          content: `你是一位专业的简历优化专家，专注于帮助求职者优化简历以更好地匹配目标岗位。
你将基于之前的AI分析报告，优化简历的内容，使其更具竞争力。
你需要返回一个JSON对象，包含optimizedContent（优化后的简历内容）和changes（主要修改说明）。`,
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
## 任务
基于以下AI分析报告，优化求职者的简历，使其更好地匹配目标岗位。

## 目标岗位
- 职位: ${job.title}
- 公司: ${job.company}
- 要求: ${job.requirements || '未提供'}
- 描述: ${job.description || '未提供'}

## 当前简历内容
${JSON.stringify(resumeContent, null, 2)}

## AI分析报告
匹配度评分: ${session.score}/100
推荐等级: ${session.recommendation}

分析内容:
${session.analysis}

## 优化要求

1. **保持真实性**: 只优化表达方式和组织结构，不要编造虚假信息
2. **突出相关性**: 突出与岗位要求相关的技能和经验
3. **量化成果**: 尽可能使用数字和具体成果来描述工作经历
4. **关键词优化**: 使用岗位描述中出现的关键词
5. **结构优化**: 调整内容顺序，将最相关的信息放在前面

## 输出格式

请返回以下JSON格式:

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
    "主要修改1：说明具体改了什么",
    "主要修改2：说明具体改了什么",
    "主要修改3：说明具体改了什么"
  ]
}

请确保optimizedContent保持原简历的真实信息，只进行表达优化和结构调整。
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
