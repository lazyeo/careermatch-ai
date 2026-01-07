import { createClient } from '@/lib/supabase-server'
import {
  createAICompletion,
  isAnyAIConfigured,
  getBestModel,
  getDefaultProvider,
  TEMPERATURE_PRESETS,
  handleAIError,
  type AIProviderType,
} from '@/lib/ai-providers'
import { NextRequest, NextResponse } from 'next/server'
import type { AIAnalysisOutput, AnalysisRecommendation } from '@careermatch/shared'

/**
 * POST /api/jobs/[id]/analyze
 *
 * 新版AI分析 - 框架内自主 + Markdown输出
 * Body: { resumeId: string, provider?: AIProviderType }
 * Returns: { sessionId, score, recommendation, analysis, provider, model }
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
    const { resumeId, provider, force } = body as { resumeId: string; provider?: AIProviderType; force?: boolean }

    if (!resumeId) {
      return NextResponse.json(
        { error: 'resumeId is required' },
        { status: 400 }
      )
    }

    // Check if session already exists (cached) - skip if force=true
    if (!force) {
      const { data: existingSession } = await supabase
        .from('analysis_sessions')
        .select('*')
        .eq('job_id', params.id)
        .eq('resume_id', resumeId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (existingSession) {
        console.log('✅ Returning cached analysis session')
        return NextResponse.json({
          sessionId: existingSession.id,
          score: existingSession.score,
          recommendation: existingSession.recommendation,
          analysis: existingSession.analysis,
          provider: existingSession.provider,
          model: existingSession.model,
        })
      }
    } else {
      console.log('🔄 Force re-analysis requested, skipping cache')
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

    // Fetch the resume with content
    const { data: resume, error: resumeError } = await supabase
      .from('resumes')
      .select('*')
      .eq('id', resumeId)
      .eq('user_id', user.id)
      .single()

    if (resumeError || !resume) {
      return NextResponse.json({ error: 'Resume not found' }, { status: 404 })
    }

    // Get the provider info
    const defaultProvider = getDefaultProvider()
    const providerName = provider || defaultProvider?.type || 'openai'
    const model = getBestModel(provider)

    console.log(`🤖 Calling ${providerName.toUpperCase()} for flexible AI analysis...`)
    console.log(`📊 Using model: ${model}`)

    // Call AI provider to perform analysis
    const analysisResult = await performFlexibleAnalysis(job, resume, provider)

    // Save session to database
    const { data: savedSession, error: saveError } = await supabase
      .from('analysis_sessions')
      .insert({
        job_id: params.id,
        resume_id: resumeId,
        user_id: user.id,
        status: 'active',
        score: analysisResult.score,
        recommendation: analysisResult.recommendation,
        analysis: analysisResult.analysis,
        provider: providerName,
        model: model,
      })
      .select()
      .single()

    if (saveError) {
      console.error('Error saving analysis session:', saveError)
      return NextResponse.json(
        { error: 'Failed to save analysis session' },
        { status: 500 }
      )
    }

    console.log('✅ Analysis completed and saved')
    return NextResponse.json({
      sessionId: savedSession.id,
      score: savedSession.score,
      recommendation: savedSession.recommendation,
      analysis: savedSession.analysis,
      provider: savedSession.provider,
      model: savedSession.model,
    })
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
 * Retrieves existing analysis session
 * Query: ?resumeId=xxx
 * Returns: AnalyzeResponse or null
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

    // Fetch existing session
    const { data: session, error } = await supabase
      .from('analysis_sessions')
      .select('*')
      .eq('job_id', params.id)
      .eq('resume_id', resumeId)
      .eq('user_id', user.id)
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
      provider: session.provider,
      model: session.model,
    })
  } catch (error) {
    console.error('Error in GET /api/jobs/[id]/analyze:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Perform flexible AI analysis - 框架内自主
 */
async function performFlexibleAnalysis(
  job: Record<string, unknown>,
  resume: Record<string, unknown>,
  provider?: AIProviderType
): Promise<AIAnalysisOutput> {
  try {
    const prompt = buildFlexiblePrompt(job, resume)

    // Call AI using unified interface
    const response = await createAICompletion({
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
      maxTokens: 8192,
    }, provider)

    const responseText = response.content
    if (!responseText) {
      throw new Error('AI provider returned empty response')
    }

    console.log('📝 Raw AI response length:', responseText.length)

    // Parse JSON response with fallback strategies
    const analysis = parseAIResponse(responseText)

    // Validate and clamp score
    if (typeof analysis.score !== 'number') {
      analysis.score = 50
    }
    analysis.score = Math.max(0, Math.min(100, Math.round(analysis.score)))

    // Validate recommendation
    if (!isValidRecommendation(analysis.recommendation)) {
      // Derive from score
      if (analysis.score >= 85) analysis.recommendation = 'strong'
      else if (analysis.score >= 65) analysis.recommendation = 'moderate'
      else if (analysis.score >= 40) analysis.recommendation = 'weak'
      else analysis.recommendation = 'not_recommended'
    }

    // Validate analysis content
    if (typeof analysis.analysis !== 'string' || analysis.analysis.length < 50) {
      throw new Error('Invalid or too short analysis in AI response')
    }

    console.log('✅ Successfully parsed AI response')
    console.log(`📊 Score: ${analysis.score}, Recommendation: ${analysis.recommendation}`)

    return analysis
  } catch (error) {
    handleAIError(error, provider)
    throw error
  }
}

/**
 * Build flexible prompt - 给AI更大自主权
 * 借鉴 resume-optimizer 项目的9维度框架，但作为参考而非强制
 */
function buildFlexiblePrompt(job: Record<string, unknown>, resume: Record<string, unknown>): string {
  // Extract resume content (might be in content.personal_info or flat structure)
  const resumeContent = resume.content as Record<string, unknown> || {}
  const personalInfo = resumeContent.personal_info as Record<string, unknown> || {}

  const fullName = personalInfo.fullName || personalInfo.full_name || resume.full_name || 'Unknown'
  const location = personalInfo.location || resume.location || 'Not specified'
  const objective = resumeContent.careerObjective || resumeContent.career_objective || resume.objective || 'Not provided'
  const skills = resumeContent.skills || resume.skills || []
  const workExperience = resumeContent.workExperience || resumeContent.work_experience || resume.work_experience || []
  const education = resumeContent.education || resume.education || []
  const projects = resumeContent.projects || resume.projects || []
  const certifications = resumeContent.certifications || resume.certifications || []

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

示例输出：
\`\`\`
---SCORE---
75
---RECOMMENDATION---
moderate
---ANALYSIS---
# 匹配分析报告

## 总体评估
这是一个很好的匹配...

## 核心发现
1. **技术栈匹配度高** - React、Node.js都是Expert级别
2. **经验充足** - 5年经验超过要求的3年

---END---
\`\`\`
`
}

/**
 * Clean JSON response from AI
 */
function cleanJsonResponse(response: string): string {
  let cleaned = response.trim()

  // Remove markdown code blocks
  if (cleaned.includes('```')) {
    const codeBlockMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
    if (codeBlockMatch) {
      cleaned = codeBlockMatch[1].trim()
    } else {
      cleaned = cleaned.replace(/```(?:json)?/gi, '').trim()
    }
  }

  // Extract JSON between braces
  const firstBrace = cleaned.indexOf('{')
  const lastBrace = cleaned.lastIndexOf('}')
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1)
  }

  return cleaned.trim()
}

/**
 * Parse AI response with fallback strategies
 * Supports both delimiter format (preferred) and JSON format (legacy)
 */
function parseAIResponse(responseText: string): AIAnalysisOutput {
  // Strategy 1: Parse delimiter format (preferred - no escaping issues)
  try {
    const delimiterResult = parseDelimiterFormat(responseText)
    if (delimiterResult) {
      console.log('✅ Successfully parsed AI response via delimiter format')
      console.log(`📝 Analysis length: ${delimiterResult.analysis.length} characters`)
      return delimiterResult
    }
  } catch (e) {
    console.log('📝 Delimiter format parsing failed:', e)
  }

  // Strategy 2: Try direct JSON parse after cleaning
  try {
    const cleaned = cleanJsonResponse(responseText)
    const parsed = JSON.parse(cleaned) as AIAnalysisOutput
    if (parsed.analysis && typeof parsed.analysis === 'string' && parsed.analysis.length > 50) {
      console.log('✅ Successfully parsed AI response via direct JSON parse')
      return parsed
    }
  } catch {
    console.log('📝 Direct JSON parse failed, trying extraction method...')
  }

  // Extract score and recommendation for fallback strategies
  const scoreMatch = responseText.match(/(?:---SCORE---|"score"\s*:)\s*(\d+)/i)
  const score = scoreMatch ? parseInt(scoreMatch[1], 10) : 50

  const recMatch = responseText.match(/(?:---RECOMMENDATION---|"recommendation"\s*:\s*"?)(strong|moderate|weak|not_recommended)/i)
  const recommendation = (recMatch ? recMatch[1] : 'moderate') as AnalysisRecommendation

  // Strategy 3: Extract analysis from mixed format
  try {
    // Look for ---ANALYSIS--- delimiter first
    const analysisDelimiterMatch = responseText.match(/---ANALYSIS---\s*([\s\S]*?)(?:---END---|$)/i)
    if (analysisDelimiterMatch && analysisDelimiterMatch[1]) {
      const analysis = analysisDelimiterMatch[1].trim()
      if (analysis.length > 100) {
        console.log('✅ Successfully extracted analysis via ANALYSIS delimiter')
        console.log(`📝 Analysis length: ${analysis.length} characters`)
        return { score, recommendation, analysis }
      }
    }
  } catch (e) {
    console.log('📝 Analysis delimiter extraction failed:', e)
  }

  // Strategy 4: Character-by-character JSON parsing for escaped content
  try {
    const analysisFieldStart = responseText.indexOf('"analysis"')
    if (analysisFieldStart !== -1) {
      const colonIdx = responseText.indexOf(':', analysisFieldStart)
      if (colonIdx !== -1) {
        let valueStart = colonIdx + 1
        while (valueStart < responseText.length && /[\s]/.test(responseText[valueStart])) {
          valueStart++
        }

        if (responseText[valueStart] === '"') {
          valueStart++
          let analysisContent = ''
          let i = valueStart
          let escaped = false

          while (i < responseText.length) {
            const char = responseText[i]

            if (escaped) {
              switch (char) {
                case 'n': analysisContent += '\n'; break
                case 'r': analysisContent += '\r'; break
                case 't': analysisContent += '\t'; break
                case '"': analysisContent += '"'; break
                case '\\': analysisContent += '\\'; break
                default: analysisContent += char; break
              }
              escaped = false
            } else if (char === '\\') {
              escaped = true
            } else if (char === '"') {
              break
            } else {
              analysisContent += char
            }
            i++
          }

          if (analysisContent.length > 100) {
            console.log('✅ Successfully extracted analysis via character-by-character parsing')
            console.log(`📝 Analysis length: ${analysisContent.length} characters`)
            return { score, recommendation, analysis: analysisContent }
          }
        }
      }
    }
  } catch (e) {
    console.log('📝 Character parsing failed:', e)
  }

  // Strategy 5: Extract markdown content directly
  try {
    const markdownHeaderMatch = responseText.match(/#+\s+[^\n]+/)
    if (markdownHeaderMatch && markdownHeaderMatch.index !== undefined) {
      const mdStart = markdownHeaderMatch.index
      let mdContent = responseText.substring(mdStart)

      // Remove trailing delimiters or JSON structure
      const endMarkers = ['---END---', '"}', '"\n}']
      for (const marker of endMarkers) {
        const markerIdx = mdContent.indexOf(marker)
        if (markerIdx > 0) {
          mdContent = mdContent.substring(0, markerIdx)
          break
        }
      }

      // Unescape content
      mdContent = mdContent
        .replace(/\\n/g, '\n')
        .replace(/\\r/g, '\r')
        .replace(/\\t/g, '\t')
        .replace(/\\"/g, '"')
        .replace(/\\\\/g, '\\')
        .trim()

      if (mdContent.length > 100) {
        console.log('✅ Successfully extracted analysis via markdown detection')
        console.log(`📝 Analysis length: ${mdContent.length} characters`)
        return { score, recommendation, analysis: mdContent }
      }
    }
  } catch (e) {
    console.log('📝 Markdown detection failed:', e)
  }

  throw new Error('Failed to parse AI response with all strategies')
}

/**
 * Parse delimiter format response
 * Format:
 * ---SCORE---
 * 75
 * ---RECOMMENDATION---
 * moderate
 * ---ANALYSIS---
 * # Markdown content...
 * ---END---
 */
function parseDelimiterFormat(responseText: string): AIAnalysisOutput | null {
  // Check if response uses delimiter format
  if (!responseText.includes('---SCORE---') || !responseText.includes('---ANALYSIS---')) {
    return null
  }

  // Extract score
  const scoreMatch = responseText.match(/---SCORE---\s*(\d+)/i)
  if (!scoreMatch) return null
  const score = Math.max(0, Math.min(100, parseInt(scoreMatch[1], 10)))

  // Extract recommendation
  const recMatch = responseText.match(/---RECOMMENDATION---\s*(strong|moderate|weak|not_recommended)/i)
  const recommendation = (recMatch ? recMatch[1] :
    score >= 85 ? 'strong' :
      score >= 65 ? 'moderate' :
        score >= 40 ? 'weak' : 'not_recommended') as AnalysisRecommendation

  // Extract analysis - everything between ---ANALYSIS--- and ---END--- (or end of string)
  const analysisMatch = responseText.match(/---ANALYSIS---\s*([\s\S]*?)(?:---END---|$)/i)
  if (!analysisMatch || !analysisMatch[1]) return null

  const analysis = analysisMatch[1].trim()
  if (analysis.length < 50) return null

  return { score, recommendation, analysis }
}

/**
 * Validate recommendation value
 */
function isValidRecommendation(value: unknown): value is AnalysisRecommendation {
  return typeof value === 'string' && ['strong', 'moderate', 'weak', 'not_recommended'].includes(value)
}
