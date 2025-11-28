import { createClient } from '@/lib/supabase-server'
import {
  createAIClient,
  isAnyAIConfigured,
  getBestModel,
  getDefaultProvider,
  TEMPERATURE_PRESETS,
  type AIProviderType,
} from '@/lib/ai-providers'
import { NextRequest, NextResponse } from 'next/server'
import { parseJsonFromAI } from '@/lib/json-utils'

/**
 * POST /api/cover-letters/generate-from-analysis
 *
 * 基于AI分析结果自动生成求职信
 * Body: { sessionId: string, provider?: AIProviderType, language?: string, tone?: string }
 * Returns: { coverLetterId: string, content: string }
 */
export async function POST(request: NextRequest) {
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
    const { sessionId, provider, language = '英文', tone = '专业且热情' } = body as {
      sessionId: string
      provider?: AIProviderType
      language?: string
      tone?: string
    }

    if (!sessionId) {
      return NextResponse.json(
        { error: 'sessionId is required' },
        { status: 400 }
      )
    }

    // Fetch analysis session
    const { data: session, error: sessionError } = await supabase
      .from('analysis_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .single()

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Analysis session not found' },
        { status: 404 }
      )
    }

    // Fetch job details
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', session.job_id)
      .eq('user_id', user.id)
      .single()

    if (jobError || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    // Fetch user profile and related data
    const [profileResult, workResult, skillsResult] = await Promise.all([
      supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single(),
      supabase
        .from('work_experiences')
        .select('*')
        .eq('user_id', user.id)
        .order('start_date', { ascending: false })
        .limit(3), // Top 3 recent experiences
      supabase.from('user_skills').select('*').eq('user_id', user.id),
    ])

    if (profileResult.error || !profileResult.data) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    const profile = profileResult.data
    const workExperiences = workResult.data || []
    const skills = skillsResult.data || []

    // Get provider info
    const defaultProvider = getDefaultProvider()
    const providerName = provider || defaultProvider?.type || 'openai'
    const model = getBestModel(provider)

    console.log(`🤖 Generating cover letter with ${providerName.toUpperCase()}`)
    console.log(`📊 Using model: ${model}`)
    console.log(`📝 Based on analysis session: ${sessionId}`)

    // Build prompt
    const prompt = buildCoverLetterPrompt(
      job,
      profile,
      workExperiences,
      skills,
      session.analysis,
      language,
      tone
    )

    // Create AI client and generate
    const aiClient = createAIClient(provider)

    const completion = await aiClient.chat.completions.create({
      model,
      messages: [
        {
          role: 'system',
          content: `你是一位专业的求职顾问，擅长撰写个性化的求职信。
你将基于用户的个人档案信息和AI的分析建议，创建一封针对特定岗位的求职信。

**重要**：
1. 求职信必须基于用户真实的经历和技能
2. 根据AI分析建议，突出与岗位最相关的内容
3. 使用专业且有吸引力的措辞
4. 展现对公司和岗位的了解
5. 输出必须是严格的JSON格式，可以被直接解析

**输出格式**：
{
  "content": "完整的求职信内容",
  "highlights": ["亮点1", "亮点2", "亮点3"],
  "wordCount": 字数
}`,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: TEMPERATURE_PRESETS.CREATIVE,
      max_tokens: 2048,
      response_format: { type: 'json_object' },
    })

    const generatedContent = completion.choices[0]?.message?.content
    if (!generatedContent) {
      throw new Error('Failed to generate cover letter content')
    }

    // Parse the generated content
    let coverLetterData
    try {
      coverLetterData = parseJsonFromAI<{
        content: string
        highlights: string[]
        wordCount: number
      }>(generatedContent)
    } catch (parseError) {
      console.error('Failed to parse generated cover letter:', parseError)
      console.error('Raw content:', generatedContent)
      throw new Error('Invalid cover letter format generated')
    }

    // Generate title
    const coverLetterTitle = `求职信 - ${job.title} at ${job.company}`

    // Save cover letter to database
    const { data: coverLetter, error: saveError } = await supabase
      .from('cover_letters')
      .insert({
        user_id: user.id,
        job_id: session.job_id,
        analysis_session_id: session.id,
        title: coverLetterTitle,
        content: coverLetterData.content,
        source: 'ai_generated',
        provider: providerName,
        model: model,
      })
      .select()
      .single()

    if (saveError) {
      console.error('Error saving cover letter:', saveError)
      throw new Error('Failed to save cover letter')
    }

    console.log('✅ Cover letter generated and saved:', coverLetter.id)

    return NextResponse.json({
      coverLetterId: coverLetter.id,
      content: coverLetterData.content,
      highlights: coverLetterData.highlights,
      wordCount: coverLetterData.wordCount,
      title: coverLetterTitle,
    })
  } catch (error) {
    console.error('Error generating cover letter:', error)
    return NextResponse.json(
      { error: 'Failed to generate cover letter' },
      { status: 500 }
    )
  }
}

/**
 * Build prompt for cover letter generation
 */
function buildCoverLetterPrompt(
  job: Record<string, unknown>,
  profile: {
    full_name?: string
    professional_summary?: string
  },
  workExperiences: Array<Record<string, unknown>>,
  skills: Array<Record<string, unknown>>,
  analysisContent: string,
  language: string,
  tone: string
): string {
  // Format work experiences
  const workExpFormatted = workExperiences
    .map(
      (exp, index) =>
        `${index + 1}. ${exp.job_title} at ${exp.company_name} (${exp.start_date} - ${exp.end_date || '至今'})
   - ${exp.description || ''}
   ${exp.achievements ? `- 成就：${(exp.achievements as string[]).join(', ')}` : ''}`
    )
    .join('\n\n')

  // Format skills
  const skillsFormatted = skills
    .map((skill) => `${skill.skill_name} (${skill.proficiency_level})`)
    .join(', ')

  return `
请基于以下信息生成一封针对性的求职信。

## 目标岗位信息
- **职位**: ${job.title}
- **公司**: ${job.company}
- **地点**: ${job.location || '未指定'}
- **描述**: ${job.description || '未提供'}
- **要求**: ${job.requirements || '未提供'}

---

## AI分析建议

${analysisContent}

---

## 求职者信息

### 基本信息
- **姓名**: ${profile.full_name || '未填写'}
- **专业摘要**: ${profile.professional_summary || '未填写'}

### 工作经历
${workExpFormatted || '暂无工作经历'}

### 技能
${skillsFormatted || '暂无技能信息'}

---

## 求职信生成要求

请基于以上的AI分析建议和用户真实信息，生成一封完整的、针对该岗位的求职信：

### 1. 写作要求
- **开篇吸引**: 用一个有力的开头说明对这个岗位的热情和适合度
- **突出匹配**: 根据AI分析，重点强调与岗位要求最匹配的经验和技能
- **具体实例**: 用具体的成就和数据来证明能力
- **公司了解**: 展示对公司的了解和加入的动机
- **结尾有力**: 以积极的行动召唤结束

### 2. 格式要求
- **语言**: ${language}
- **语气**: ${tone}
- **长度**: 250-400字
- **结构**: 3-4段

### 3. 注意事项
- 所有内容必须基于用户真实信息，不能编造
- 不要生硬地列举技能，要自然地融入到叙述中
- 展现个性和热情，避免过于模板化
- 确保每一段都有明确的目的

请严格按照JSON格式输出，确保可以被直接解析。
`
}
