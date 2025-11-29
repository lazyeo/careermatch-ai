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
 * POST /api/jobs/[id]/analyze/profile-stream
 *
 * 基于用户Profile的流式AI分析 - 当用户没有简历时使用
 * Body: { provider?: AIProviderType }
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
    const { provider } = body as {
      provider?: AIProviderType
    }

    // Fetch job and user profile with all related data
    const [
      jobResult,
      profileResult,
      workResult,
      educationResult,
      skillsResult,
      projectsResult,
      certificationsResult,
    ] = await Promise.all([
      supabase
        .from('jobs')
        .select('*')
        .eq('id', params.id)
        .eq('user_id', user.id)
        .single(),
      supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single(),
      supabase
        .from('work_experiences')
        .select('*')
        .eq('user_id', user.id)
        .order('start_date', { ascending: false }),
      supabase
        .from('education_records')
        .select('*')
        .eq('user_id', user.id)
        .order('start_date', { ascending: false }),
      supabase
        .from('user_skills')
        .select('*')
        .eq('user_id', user.id)
        .order('category'),
      supabase
        .from('user_projects')
        .select('*')
        .eq('user_id', user.id)
        .order('start_date', { ascending: false }),
      supabase
        .from('user_certifications')
        .select('*')
        .eq('user_id', user.id)
        .order('issue_date', { ascending: false }),
    ])

    if (jobResult.error || !jobResult.data) {
      return new Response(JSON.stringify({ error: 'Job not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    if (profileResult.error || !profileResult.data) {
      return new Response(
        JSON.stringify({ error: 'Profile not found. Please complete your profile first.' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const job = jobResult.data
    const profile = {
      ...profileResult.data,
      work_experiences: workResult.data || [],
      education_records: educationResult.data || [],
      skills: skillsResult.data || [],
      projects: projectsResult.data || [],
      certifications: certificationsResult.data || [],
    }

    // Get provider info
    const defaultProvider = getDefaultProvider()
    const providerName = provider || defaultProvider?.type || 'openai'
    const model = getBestModel(provider)

    console.log(`🤖 Starting profile-based streaming analysis with ${providerName.toUpperCase()}`)
    console.log(`📊 Using model: ${model}`)

    // Build prompt for profile-based analysis
    const prompt = buildProfileAnalysisPrompt(job, profile)

    // Create AI client and stream
    const aiClient = createAIClient(provider)

    const stream = await aiClient.chat.completions.create({
      model,
      messages: [
        {
          role: 'system',
          content: `你是一位经验丰富的职业顾问和招聘专家，专注于新西兰就业市场。
你将基于用户的个人档案信息分析与目标岗位的匹配度，并给出针对性的简历撰写建议。

**重要**：用户目前没有针对这个岗位的简历，你需要：
1. 分析用户背景与岗位的匹配程度
2. 指出用户具备的优势和可能的不足
3. 给出详细的简历撰写建议，包括应该突出什么、如何组织内容

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

          // Parse the complete response
          const parsed = parseDelimiterFormat(fullResponse)

          // Save to database (with null resume_id to indicate profile-based analysis)
          const { data: savedSession, error: saveError} = await supabase
            .from('analysis_sessions')
            .insert({
              job_id: params.id,
              resume_id: null, // Profile-based analysis has no resume (null indicates profile-based)
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
            console.log('✅ Profile-based streaming analysis completed and saved')
          }

          // Send final message with session info - check if controller is still open
          try {
            const finalData = JSON.stringify({
              done: true,
              sessionId: savedSession?.id,
              score: parsed?.score || 50,
              recommendation: parsed?.recommendation || 'moderate',
              analysisType: 'profile_based',
            })
            controller.enqueue(encoder.encode(`data: ${finalData}\n\n`))
            controller.close()
          } catch {
            // Client disconnected, but we already saved to DB, so it's okay
            console.log('Client disconnected before receiving final message')
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
    console.error('Error in profile-based streaming analysis:', error)
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
 * Build prompt for profile-based analysis
 */
function buildProfileAnalysisPrompt(
  job: Record<string, unknown>,
  profile: {
    full_name?: string
    location?: string
    professional_summary?: string
    target_roles?: string[]
    work_experiences: Array<Record<string, unknown>>
    education_records: Array<Record<string, unknown>>
    skills: Array<Record<string, unknown>>
    projects: Array<Record<string, unknown>>
    certifications: Array<Record<string, unknown>>
  }
): string {
  // Format work experiences
  const workExperiencesFormatted = profile.work_experiences.map((exp) => ({
    company: exp.company_name,
    title: exp.job_title,
    location: exp.location,
    startDate: exp.start_date,
    endDate: exp.end_date || '至今',
    description: exp.description,
    achievements: exp.achievements,
  }))

  // Format education
  const educationFormatted = profile.education_records.map((edu) => ({
    institution: edu.institution_name,
    degree: edu.degree,
    field: edu.field_of_study,
    startDate: edu.start_date,
    endDate: edu.end_date,
    gpa: edu.gpa,
  }))

  // Format skills by category
  const skillsFormatted = profile.skills.map((skill) => ({
    name: skill.skill_name,
    category: skill.category,
    level: skill.proficiency_level,
    years: skill.years_of_experience,
  }))

  // Format projects
  const projectsFormatted = profile.projects.map((proj) => ({
    name: proj.project_name,
    role: proj.role,
    description: proj.description,
    technologies: proj.technologies,
    url: proj.project_url,
  }))

  // Format certifications
  const certificationsFormatted = profile.certifications.map((cert) => ({
    name: cert.certification_name,
    issuer: cert.issuing_organization,
    date: cert.issue_date,
    expires: cert.expiration_date,
    credentialId: cert.credential_id,
  }))

  return `
请基于以下用户的个人档案信息，分析与目标岗位的匹配度，并给出针对性的简历撰写建议。

## 目标岗位信息
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

## 用户个人档案信息

### 基本信息
- **姓名**: ${profile.full_name || '未填写'}
- **位置**: ${profile.location || '未填写'}
- **目标岗位**: ${profile.target_roles?.join('、') || '未设置'}

### 个人简介
${profile.professional_summary || '未填写'}

### 工作经历 (${profile.work_experiences.length} 条)
${JSON.stringify(workExperiencesFormatted, null, 2)}

### 教育背景 (${profile.education_records.length} 条)
${JSON.stringify(educationFormatted, null, 2)}

### 技能 (${profile.skills.length} 项)
${JSON.stringify(skillsFormatted, null, 2)}

### 项目经验 (${profile.projects.length} 个)
${JSON.stringify(projectsFormatted, null, 2)}

### 证书 (${profile.certifications.length} 个)
${JSON.stringify(certificationsFormatted, null, 2)}

---

## ⚠️ 字数限制
**重要**：请将分析报告控制在 **1000字左右**（±100字），保持精炼高效。

## 分析要求

请从以下角度进行**简明扼要**的分析（每部分都要精炼）：

### 1. 匹配度评估（~100字）
- 整体匹配程度（核心观点1-2句）
- 关键匹配点和不匹配点
- 0-100分数

### 2. 核心优势（~150字）
- 2-3个最突出的竞争优势
- 能打动招聘方的关键点

### 3. 主要差距（~150字）
- 2-3个关键gap
- 如何在简历中应对

### 4. 简历撰写建议（~400字，重点）
简明给出：
- **格式选择**：1句话推荐格式和原因
- **结构顺序**：建议的section排列
- **个人简介**：1-2句话模板或要点
- **工作经历**：如何突出相关性（1-2个具体示例）
- **关键词**：必须包含的5-7个关键词
- **一个具体优化示例**：选一段经历给出前后对比

### 5. 行动建议（~150字）
- 2-3个最重要的准备事项
- 1-2个可能的面试问题

**提示**：每个部分都要简洁有力，避免冗长说明，直击要点。

---

## 输出格式（重要！请严格遵循）

请使用以下**分隔符格式**输出：

\`\`\`
---SCORE---
<0-100的整数>
---RECOMMENDATION---
<strong|moderate|weak|not_recommended>
---ANALYSIS---
<Markdown格式的详细分析报告，重点包含简历撰写建议>
---END---
\`\`\`

说明：
- SCORE: 0-100的匹配度评分
- RECOMMENDATION: 推荐等级
  - strong (85-100): 强烈推荐申请，背景非常匹配
  - moderate (65-84): 值得尝试，有一定匹配度
  - weak (40-64): 有差距但可以尝试
  - not_recommended (0-39): 差距较大，建议先提升
- ANALYSIS: Markdown格式的分析报告，**控制在1000字左右，精炼高效**

**重要约束**：
1. 总字数控制在1000字左右（±100字）
2. 用户还没有针对此岗位的简历，重点给出简历撰写建议
3. 每个部分都要简明扼要，避免冗长
4. 使用清晰的Markdown格式（标题、列表、加粗）
5. 直击要点，删除不必要的解释
`
}
