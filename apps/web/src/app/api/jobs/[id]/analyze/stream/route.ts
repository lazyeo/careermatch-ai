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
import { getAnalysisOutputLocale } from '@/lib/ai/analysis-locale'

/**
 * POST /api/jobs/[id]/analyze/stream
 *
 * 流式AI分析 - 实时返回分析内容
 * Body: { resumeId: string, provider?: AIProviderType }
 * Returns: SSE stream with analysis chunks
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: jobId } = await params
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
    const { resumeId, provider, mode } = body as {
      resumeId?: string
      provider?: AIProviderType
      mode?: 'resume_match' | 'job_summary'
      locale?: string
    }
    const locale = getAnalysisOutputLocale()

    const isJobSummary = mode === 'job_summary'

    if (!isJobSummary && !resumeId) {
      return new Response(JSON.stringify({ error: 'resumeId is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Fetch job and resume (if needed)
    const [jobResult, resumeResult] = await Promise.all([
      supabase
        .from('jobs')
        .select('*')
        .eq('id', jobId)
        .eq('user_id', user.id)
        .single(),
      isJobSummary
        ? Promise.resolve({ data: null, error: null })
        : supabase
          .from('resumes')
          .select('*')
          .eq('id', resumeId!)
          .eq('user_id', user.id)
          .single(),
    ])

    if (jobResult.error || !jobResult.data) {
      return new Response(JSON.stringify({ error: 'Job not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    if (!isJobSummary && (resumeResult.error || !resumeResult.data)) {
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
    console.log(`🎯 Mode: ${mode || 'resume_match'}`)
    console.log(`🌐 Locale: ${locale}`)

    // Build prompt
    const prompt = isJobSummary
      ? buildJobSummaryPrompt(job, locale)
      : buildFlexiblePrompt(job, resume!, locale)

    let systemPrompt = ''

    if (isJobSummary) {
      if (locale === 'en') {
        systemPrompt = `You are an experienced career consultant and recruitment expert specializing in the New Zealand job market.
You will provide a deep critique of the job description, highlighting key points, potential risks, and core requirements.

**Output Format Requirements**:
Please output the analysis report directly in Markdown format. Do not include SCORE or RECOMMENDATION delimiters.`
      } else {
        systemPrompt = `你是一位经验丰富的职业顾问和招聘专家，专注于新西兰就业市场。
你将对职位描述进行深度点评，指出亮点、潜在风险和核心要求。

**输出格式要求**：
请直接输出Markdown格式的分析报告。不需要包含SCORE或RECOMMENDATION分隔符。`
      }
    } else {
      if (locale === 'en') {
        systemPrompt = `You are an experienced career consultant and recruitment expert specializing in the New Zealand job market.
You will conduct a deep resume-job match analysis, with autonomy to decide which dimensions to analyze and how deeply.

**Output Format Requirements**: Please strictly use the delimiter format for output, do not use JSON format. The format is as follows:
---SCORE---
<Score>
---RECOMMENDATION---
<Recommendation Level>
---ANALYSIS---
<Markdown Analysis Report>
---END---

This format allows you to freely use any Markdown syntax, including quotes, code blocks, etc.`
      } else {
        systemPrompt = `你是一位经验丰富的职业顾问和招聘专家，专注于新西兰就业市场。
你将进行深度的简历-岗位匹配分析，拥有自主权决定分析哪些维度、如何深入。

**输出格式要求**：请严格使用分隔符格式输出，不要使用JSON格式。格式如下：
---SCORE---
<分数>
---RECOMMENDATION---
<推荐等级>
---ANALYSIS---
<Markdown分析报告>
---END---

这种格式可以让你自由使用任何Markdown语法，包括引号、代码块等。`
      }
    }

    // Create AI client and stream
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let stream: any

    if (providerName === 'claude') {
      const { createAnthropicClient } = await import('@/lib/ai-providers')
      const client = createAnthropicClient()

      stream = await client.messages.create({
        model: model,
        max_tokens: 4096,
        system: systemPrompt,
        messages: [{ role: 'user', content: prompt }],
        stream: true,
      })
    } else {
      const aiClient = createAIClient(provider)
      stream = await aiClient.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt },
        ],
        temperature: TEMPERATURE_PRESETS.BALANCED,
        max_tokens: 8192,
        stream: true,
      })
    }

    // Create a TransformStream to process the chunks
    const encoder = new TextEncoder()

    // Collect full response for saving
    let fullResponse = ''

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            let content = ''

            // Handle different stream formats
            if (providerName === 'claude') {
              if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
                content = chunk.delta.text
              }
            } else {
              // OpenAI format
              content = chunk.choices?.[0]?.delta?.content || ''
            }

            if (content) {
              fullResponse += content

              // Send SSE formatted data - check if controller is still open
              try {
                const data = JSON.stringify({ content, done: false })
                controller.enqueue(encoder.encode(`data: ${data}\n\n`))
              } catch {
                // Client disconnected, stop streaming
                console.log('Client disconnected during streaming')
                return
              }
            }
          }

          if (!isJobSummary) {
            // Parse the complete response
            const parsed = parseDelimiterFormat(fullResponse)

            // Save to database (only for resume match)
            const { data: savedSession, error: saveError } = await supabase
              .from('analysis_sessions')
              .insert({
                job_id: jobId,
                resume_id: resumeId!,
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
            try {
              const finalData = JSON.stringify({
                done: true,
                sessionId: savedSession?.id,
                score: parsed?.score || 50,
                recommendation: parsed?.recommendation || 'moderate',
              })
              controller.enqueue(encoder.encode(`data: ${finalData}\n\n`))
              controller.close()
            } catch {
              console.log('Client disconnected before receiving final message')
            }
          } else {
            // For job summary, save to jobs table and close stream
            const { error: updateError } = await supabase
              .from('jobs')
              .update({ ai_analysis: fullResponse })
              .eq('id', jobId)
              .eq('user_id', user.id)

            if (updateError) {
              console.error('Error saving job summary:', updateError)
            } else {
              console.log('✅ Job summary saved to database')
            }

            try {
              const finalData = JSON.stringify({ done: true })
              controller.enqueue(encoder.encode(`data: ${finalData}\n\n`))
              controller.close()
            } catch {
              console.log('Client disconnected before receiving final message')
            }
          }
        } catch (error) {
          console.error('Stream error:', error)
          // Try to send error message, but don't throw if controller is closed
          try {
            const errorData = JSON.stringify({
              error: 'Stream error',
              done: true,
            })
            controller.enqueue(encoder.encode(`data: ${errorData}\n\n`))
            controller.close()
          } catch {
            // Controller already closed, nothing we can do
            console.log('Controller already closed, cannot send error message')
          }
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
 * Build job summary prompt
 */
function buildJobSummaryPrompt(job: Record<string, unknown>, locale: string = 'en'): string {
  if (locale === 'en') {
    return `
Please provide a deep critique and analysis of the following job position.

## Job Information
- **Title**: ${job.title}
- **Company**: ${job.company}
- **Location**: ${job.location || 'Not specified'}
- **Type**: ${job.job_type || 'Not specified'}
- **Salary Range**: ${job.salary_min && job.salary_max ? `${job.salary_currency || 'NZD'} ${job.salary_min} - ${job.salary_max}` : 'Not specified'}
- **Description**:
${job.description || 'Not provided'}

- **Requirements**:
${job.requirements || 'Not provided'}

- **Benefits**:
${job.benefits || 'Not provided'}

---

## Analysis Requirements

Please analyze the pros and cons of this position from a career consultant's perspective and provide recommendations.

Please include the following sections (use Markdown Level 2 headers):

### 1. Job Highlights ✨
Analyze the attractiveness of this position, such as salary, career prospects, company background, benefits, etc.

### 2. Potential Challenges & Risks ⚠️
Point out potential pitfalls or challenges, such as unclear responsibilities, overly high requirements, industry risks, etc.

### 3. Core Competency Requirements 🎯
Summarize the top 3 hard skills and top 3 soft skills required to secure this offer.

### 4. Application Advice 💡
Specific advice for applicants, such as what to highlight in the resume and what questions to ask during the interview.

Please be objective and sharp, do not just say nice things.
`
  }

  return `
请对以下职位进行深度点评和分析。

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

## 分析要求

请从职业顾问的角度，分析这个职位的优劣势，并给出建议。

请包含以下几个部分（使用Markdown二级标题）：

### 1. 职位亮点 ✨
分析这个职位的吸引力，例如薪资、发展前景、公司背景、福利等。

### 2. 潜在挑战与风险 ⚠️
指出这个职位可能存在的坑或挑战，例如职责不清、要求过高、行业风险等。

### 3. 核心竞争力要求 🎯
总结要拿下这个offer，候选人必须具备的最核心的3个硬技能和3个软技能。

### 4. 申请建议 💡
给申请者的具体建议，例如简历应该突出什么，面试应该问什么问题。

请保持客观、犀利，不要只说好话。
`
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
  resume: Record<string, unknown>,
  locale: string = 'en'
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

  if (locale === 'en') {
    return `
Please conduct a deep match analysis between the following candidate and the target position.

## Job Information
- **Title**: ${job.title}
- **Company**: ${job.company}
- **Location**: ${job.location || 'Not specified'}
- **Type**: ${job.job_type || 'Not specified'}
- **Salary Range**: ${job.salary_min && job.salary_max ? `${job.salary_currency || 'NZD'} ${job.salary_min} - ${job.salary_max}` : 'Not specified'}
- **Description**:
${job.description || 'Not provided'}

- **Requirements**:
${job.requirements || 'Not provided'}

- **Benefits**:
${job.benefits || 'Not provided'}

---

## Candidate Resume
- **Name**: ${fullName}
- **Location**: ${location}
- **Objective**: ${objective}
- **Skills**: ${JSON.stringify(skills, null, 2)}
- **Work Experience**: ${JSON.stringify(workExperience, null, 2)}
- **Education**: ${JSON.stringify(education, null, 2)}
- **Projects**: ${JSON.stringify(projects, null, 2)}
- **Certifications**: ${JSON.stringify(certifications, null, 2)}

---

## Analysis Framework Reference (Choose focus areas autonomously)

Here are 9 dimensions for your reference, please decide which ones to analyze deeply based on the job characteristics:

1. **Role Positioning Analysis** - Job nature, core responsibilities, career path
2. **Keyword Matching** - Must-have skills, technical requirements, soft skills
3. **Skill Requirement Grading** - Mandatory vs. nice-to-have
4. **SWOT Analysis** - Candidate's Strengths/Weaknesses/Opportunities/Threats
5. **CV Strategy Advice** - What to highlight/avoid in the resume
6. **Interview Preparation** - Potential questions and preparation advice
7. **Competitiveness Assessment** - Unique advantages compared to other candidates
8. **Skill Gap** - Areas for improvement and learning suggestions
9. **Action Plan** - Preparation needed before applying

---

## Output Requirements

You have full autonomy to decide:
- Which dimensions to focus on (choose the most relevant 3-6)
- How to organize and present the analysis content
- Where to go deep and where to be brief

### Must Include
1. **Overall Assessment** - Match score (0-100) + Recommendation Level
2. **Key Findings** - 3-5 key insights
3. **Proactive Advice** - Things the candidate should know but might not have thought of

### Encouraged to Include (If relevant)
- Potential interview questions
- Specific resume optimization suggestions
- Hidden requirements or cultural implications of this role

---

## Output Format (Important! Please follow strictly)

Please use the following **delimiter format** for output, do not use pure JSON:

\`\`\`
---SCORE---
<Integer 0-100>
---RECOMMENDATION---
<strong|moderate|weak|not_recommended>
---ANALYSIS---
<Detailed analysis report in Markdown format, free to use any Markdown syntax>
---END---
\`\`\`

Explanation:
- SCORE: 0-100 match score
- RECOMMENDATION: Recommendation level
  - strong (85-100): Strongly recommended
  - moderate (65-84): Worth trying
  - weak (40-64): Some chance
  - not_recommended (0-39): Not recommended
- ANALYSIS: Complete analysis report in Markdown format

**Important**:
1. Must use the above delimiter format, each delimiter on a separate line
2. ANALYSIS section can contain any Markdown content, including quotes, code blocks, tables, etc.
3. End output with ---END---
`
  }

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
