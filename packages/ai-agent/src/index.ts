/**
 * AI求职信生成器
 *
 * 根据用户Profile和岗位信息，生成个性化求职信
 */

import OpenAI from 'openai'

// 用户资料接口
export interface UserProfile {
  full_name: string
  email?: string
  phone?: string
  location?: string
  professional_summary?: string
}

// 工作经历接口
export interface WorkExperience {
  company: string
  position: string
  start_date: string
  end_date?: string
  is_current: boolean
  description?: string
  achievements?: string[]
  technologies?: string[]
}

// 技能接口
export interface Skill {
  name: string
  level?: string
  category?: string
}

// 岗位信息接口
export interface JobInfo {
  title: string
  company: string
  location?: string
  description?: string
  requirements?: string
}

// 求职信生成输入
export interface CoverLetterInput {
  profile: UserProfile
  workExperiences: WorkExperience[]
  skills: Skill[]
  job: JobInfo
  tone?: 'professional' | 'friendly' | 'formal'
  language?: 'en' | 'zh'
}

// 生成的求职信
export interface GeneratedCoverLetter {
  content: string
  highlights: string[]
  wordCount: number
}

// AI生成Prompt
const COVER_LETTER_PROMPT = `你是一位专业的求职顾问，擅长撰写个性化的求职信。请根据以下信息，生成一封针对性强、专业且有吸引力的求职信。

## 求职者信息
姓名：{NAME}
专业摘要：{SUMMARY}

### 工作经历
{WORK_EXPERIENCE}

### 技能
{SKILLS}

## 目标岗位
岗位：{JOB_TITLE}
公司：{COMPANY}
地点：{JOB_LOCATION}

岗位描述：
{JOB_DESCRIPTION}

岗位要求：
{JOB_REQUIREMENTS}

## 写作要求
1. **开篇吸引**：用一个有力的开头说明你对这个岗位的热情和适合度
2. **突出匹配**：重点强调你的经验和技能如何匹配岗位要求
3. **具体实例**：用具体的成就和数据来证明你的能力
4. **公司了解**：展示你对公司的了解和加入的动机
5. **结尾有力**：以积极的行动召唤结束

## 格式要求
- 语言：{LANGUAGE}
- 语气：{TONE}
- 长度：250-400字
- 结构：3-4段

## 输出格式
返回JSON格式（不要用markdown代码块）：
{
  "content": "完整的求职信内容",
  "highlights": ["亮点1", "亮点2", "亮点3"],
  "wordCount": 字数
}

注意：
1. 不要生硬地列举技能，要自然地融入到叙述中
2. 展现个性和热情，避免过于模板化
3. 确保每一段都有明确的目的
4. 直接返回JSON，不要用markdown包裹`

/**
 * 生成求职信
 */
export async function generateCoverLetter(
  input: CoverLetterInput
): Promise<GeneratedCoverLetter> {
  const apiKey = process.env.CLAUDE_API_KEY
  const baseUrl =
    process.env.CLAUDE_BASE_URL || 'https://relay.a-dobe.club/api/v1'

  if (!apiKey) {
    throw new Error('CLAUDE_API_KEY is not configured')
  }

  const client = new OpenAI({
    apiKey: apiKey,
    baseURL: baseUrl,
  })

  const model = 'claude-sonnet-4-5-20250929'

  // 格式化工作经历
  const workExpStr = input.workExperiences
    .map(
      (w) =>
        `- ${w.position} @ ${w.company} (${w.start_date} - ${w.is_current ? '至今' : w.end_date})
  ${w.description || ''}
  成就: ${w.achievements?.join('; ') || '无'}
  技术: ${w.technologies?.join(', ') || '无'}`
    )
    .join('\n\n')

  // 格式化技能
  const skillsStr = input.skills
    .map((s) => `${s.name}${s.level ? ` (${s.level})` : ''}`)
    .join(', ')

  // 构建prompt
  const prompt = COVER_LETTER_PROMPT.replace('{NAME}', input.profile.full_name)
    .replace('{SUMMARY}', input.profile.professional_summary || '无')
    .replace('{WORK_EXPERIENCE}', workExpStr || '无')
    .replace('{SKILLS}', skillsStr || '无')
    .replace('{JOB_TITLE}', input.job.title)
    .replace('{COMPANY}', input.job.company)
    .replace('{JOB_LOCATION}', input.job.location || '未指定')
    .replace('{JOB_DESCRIPTION}', input.job.description || '无')
    .replace('{JOB_REQUIREMENTS}', input.job.requirements || '无')
    .replace('{LANGUAGE}', input.language === 'zh' ? '中文' : '英文')
    .replace(
      '{TONE}',
      input.tone === 'formal'
        ? '正式'
        : input.tone === 'friendly'
          ? '友好'
          : '专业'
    )

  console.log('📝 Generating cover letter...')
  console.log(`📊 Using model: ${model}`)

  const response = await client.chat.completions.create({
    model,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: 0.7, // 稍高的温度以增加创意
    max_tokens: 2000,
  })

  const responseText = response.choices[0]?.message?.content || ''
  console.log(`📝 AI response length: ${responseText.length}`)

  // 解析JSON
  try {
    const { parseJsonFromAI } = await import('@careermatch/shared')
    const parsed = parseJsonFromAI<GeneratedCoverLetter>(responseText)
    console.log('✅ Successfully generated cover letter')

    return {
      content: parsed.content || '',
      highlights: parsed.highlights || [],
      wordCount: parsed.wordCount || parsed.content?.length || 0,
    }
  } catch (error) {
    console.error('❌ Failed to parse AI response:', error)

    console.error('❌ Returning raw text due to JSON parse failure')

    // 回退：将响应作为内容返回
    return {
      content: responseText,
      highlights: [],
      wordCount: responseText.length,
    }
  }
}

export * from './core/MemoryManager'
export * from './core/AgentService'
