import { createClient } from '@/lib/supabase-server'
import {
  createAIClient,
  isAnyAIConfigured,
  getBestModel,
  getDefaultProvider,
  TEMPERATURE_PRESETS,
  type AIProviderType,
} from '@/lib/ai-providers'
import { NextRequest } from 'next/server'
import type { AnalysisRecommendation } from '@careermatch/shared'

/**
 * POST /api/jobs/[id]/analyze/stream
 *
 * 流式AI分析 - 实时返回分析内容
 * Body: { resumeId: string, provider?: AIProviderType }
 * Returns: SSE stream with analysis chunks
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
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Check if any AI provider is configured
    if (!isAnyAIConfigured()) {
      return new Response(
        JSON.stringify({ error: 'No AI provider is configured' }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Get request body
    const body = await request.json()
    const { resumeId, provider } = body as {
      resumeId: string
      provider?: AIProviderType
    }

    if (!resumeId) {
      return new Response(JSON.stringify({ error: 'resumeId is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Fetch job and resume
    const [jobResult, resumeResult] = await Promise.all([
      supabase
        .from('jobs')
        .select('*')
        .eq('id', params.id)
        .eq('user_id', user.id)
        .single(),
      supabase
        .from('resumes')
        .select('*')
        .eq('id', resumeId)
        .eq('user_id', user.id)
        .single(),
    ])

    if (jobResult.error || !jobResult.data) {
      return new Response(JSON.stringify({ error: 'Job not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    if (resumeResult.error || !resumeResult.data) {
      return new Response(JSON.stringify({ error: 'Resume not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const job = jobResult.data
    const resume = resumeResult.data

    // Get provider info
    const defaultProvider = getDefaultProvider()
    const providerName = provider || defaultProvider?.type || 'openai'
    const model = getBestModel(provider)

    console.log(`🤖 Starting streaming analysis with ${providerName.toUpperCase()}`)
    console.log(`📊 Using model: ${model}`)

    // Build prompt
    const prompt = buildFlexiblePrompt(job, resume)

    // Create AI client and stream
    const aiClient = createAIClient(provider)

    const stream = await aiClient.chat.completions.create({
      model,
      messages: [
        {
          role: 'system',
          content: `你是一位经验丰富的职业顾问和招聘专家，专注于新西兰就业市场。
你将进行深度的简历-岗位匹配分析，拥有自主权决定分析哪些维度、如何深入。

**输出格式要求**：请严格使用分隔符格式输出，不要使用JSON格式。格式如下：
---SCORE---
<分数>
---RECOMMENDATION---
<推荐等级>
---ANALYSIS---
<Markdown分析报告>
---END---

这种格式可以让你自由使用任何Markdown语法，包括引号、代码块等。`,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: TEMPERATURE_PRESETS.BALANCED,
      max_tokens: 8192,
      stream: true,
    })

    // Create a TransformStream to process the chunks
    const encoder = new TextEncoder()

    // Collect full response for saving
    let fullResponse = ''

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || ''
            if (content) {
              fullResponse += content

              // Send SSE formatted data
              const data = JSON.stringify({ content, done: false })
              controller.enqueue(encoder.encode(`data: ${data}\n\n`))
            }
          }

          // Parse the complete response
          const parsed = parseDelimiterFormat(fullResponse)

          // Save to database
          const { data: savedSession, error: saveError } = await supabase
            .from('analysis_sessions')
            .insert({
              job_id: params.id,
              resume_id: resumeId,
              user_id: user.id,
              status: 'active',
              score: parsed?.score || 50,
              recommendation: parsed?.recommendation || 'moderate',
              analysis: parsed?.analysis || fullResponse,
              provider: providerName,
              model: model,
            })
            .select()
            .single()

          if (saveError) {
            console.error('Error saving session:', saveError)
          } else {
            console.log('✅ Streaming analysis completed and saved')
          }

          // Send final message with session info
          const finalData = JSON.stringify({
            done: true,
            sessionId: savedSession?.id,
            score: parsed?.score || 50,
            recommendation: parsed?.recommendation || 'moderate',
          })
          controller.enqueue(encoder.encode(`data: ${finalData}\n\n`))
          controller.close()
        } catch (error) {
          console.error('Stream error:', error)
          const errorData = JSON.stringify({
            error: 'Stream error',
            done: true,
          })
          controller.enqueue(encoder.encode(`data: ${errorData}\n\n`))
          controller.close()
        }
      },
    })

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch (error) {
    console.error('Error in streaming analysis:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

/**
 * Parse delimiter format response
 */
function parseDelimiterFormat(responseText: string): {
  score: number
  recommendation: AnalysisRecommendation
  analysis: string
} | null {
  if (
    !responseText.includes('---SCORE---') ||
    !responseText.includes('---ANALYSIS---')
  ) {
    return null
  }

  const scoreMatch = responseText.match(/---SCORE---\s*(\d+)/i)
  if (!scoreMatch) return null
  const score = Math.max(0, Math.min(100, parseInt(scoreMatch[1], 10)))

  const recMatch = responseText.match(
    /---RECOMMENDATION---\s*(strong|moderate|weak|not_recommended)/i
  )
  const recommendation = (recMatch
    ? recMatch[1]
    : score >= 85
      ? 'strong'
      : score >= 65
        ? 'moderate'
        : score >= 40
          ? 'weak'
          : 'not_recommended') as AnalysisRecommendation

  const analysisMatch = responseText.match(
    /---ANALYSIS---\s*([\s\S]*?)(?:---END---|$)/i
  )
  if (!analysisMatch || !analysisMatch[1]) return null

  const analysis = analysisMatch[1].trim()
  if (analysis.length < 50) return null

  return { score, recommendation, analysis }
}

/**
 * Build flexible prompt
 */
function buildFlexiblePrompt(
  job: Record<string, unknown>,
  resume: Record<string, unknown>
): string {
  const resumeContent = (resume.content as Record<string, unknown>) || {}
  const personalInfo =
    (resumeContent.personal_info as Record<string, unknown>) || {}

  const fullName =
    personalInfo.fullName ||
    personalInfo.full_name ||
    resume.full_name ||
    'Unknown'
  const location = personalInfo.location || resume.location || 'Not specified'
  const objective =
    resumeContent.careerObjective ||
    resumeContent.career_objective ||
    resume.objective ||
    'Not provided'
  const skills = resumeContent.skills || resume.skills || []
  const workExperience =
    resumeContent.workExperience ||
    resumeContent.work_experience ||
    resume.work_experience ||
    []
  const education = resumeContent.education || resume.education || []
  const projects = resumeContent.projects || resume.projects || []
  const certifications =
    resumeContent.certifications || resume.certifications || []

  return `
请对以下求职者与目标岗位进行深度匹配分析。

## 岗位信息
- **职位**: ${job.title}
- **公司**: ${job.company}
- **地点**: ${job.location || '未指定'}
- **类型**: ${job.job_type || '未指定'}
- **薪资范围**: ${job.salary_min && job.salary_max ? `${job.salary_currency || 'NZD'} ${job.salary_min} - ${job.salary_max}` : '未指定'}
- **岗位描述**:
${job.description || '未提供'}

- **岗位要求**:
${job.requirements || '未提供'}

- **福利待遇**:
${job.benefits || '未提供'}

---

## 求职者简历
- **姓名**: ${fullName}
- **位置**: ${location}
- **求职目标**: ${objective}
- **技能**: ${JSON.stringify(skills, null, 2)}
- **工作经历**: ${JSON.stringify(workExperience, null, 2)}
- **教育背景**: ${JSON.stringify(education, null, 2)}
- **项目经验**: ${JSON.stringify(projects, null, 2)}
- **证书**: ${JSON.stringify(certifications, null, 2)}

---

## 分析框架参考 (可自主选择重点)

以下9个维度供你参考，请根据岗位特点自主决定哪些需要深入分析：

1. **角色定位分析** - 职位性质、核心职责、发展路径
2. **关键词匹配** - must-have技能、技术要求、软技能
3. **技能要求分级** - 哪些是必须的、哪些是加分项
4. **SWOT分析** - 候选人的优势/劣势/机会/威胁
5. **CV策略建议** - 简历应该突出什么、避免什么
6. **面试准备** - 可能被问到的问题、准备建议
7. **竞争力评估** - 相比其他候选人的独特优势
8. **技能差距** - 需要提升的方面及学习建议
9. **行动建议** - 申请前需要做的准备

---

## 输出要求

你有完全的自主权决定:
- 重点分析哪些维度 (选择最相关的3-6个)
- 如何组织和呈现分析内容
- 哪些地方需要深入、哪些可以简略

### 必须包含
1. **总体评估** - 匹配度评分(0-100) + 推荐等级
2. **核心发现** - 3-5个关键洞察
3. **主动建议** - 你认为候选人应该知道但可能没想到的事情

### 鼓励包含 (如果相关)
- 面试可能会问的问题
- 简历需要优化的具体地方
- 这个岗位的隐藏要求或文化暗示

---

## 输出格式（重要！请严格遵循）

请使用以下**分隔符格式**输出，不要使用纯JSON：

\`\`\`
---SCORE---
<0-100的整数>
---RECOMMENDATION---
<strong|moderate|weak|not_recommended>
---ANALYSIS---
<Markdown格式的详细分析报告，可以自由使用任何Markdown语法>
---END---
\`\`\`

说明：
- SCORE: 0-100的匹配度评分
- RECOMMENDATION: 推荐等级
  - strong (85-100): 强烈推荐申请
  - moderate (65-84): 值得尝试
  - weak (40-64): 有一定机会
  - not_recommended (0-39): 不建议申请
- ANALYSIS: Markdown格式的完整分析报告

**重要**：
1. 必须使用上述分隔符格式，每个分隔符占单独一行
2. ANALYSIS部分可以包含任何Markdown内容，包括引号、代码块、表格等
3. 以---END---结束输出
`
}
