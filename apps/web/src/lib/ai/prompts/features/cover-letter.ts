/**
 * 求职信生成 Prompt
 *
 * 根据用户Profile和岗位信息生成个性化求职信
 */

import type { PromptTemplate } from '../types'
import { PERSONAS } from '../templates/system-personas'
import { OUTPUT_FORMAT_INSTRUCTIONS } from '../templates/output-formats'
import { ANALYSIS_PRINCIPLES } from '../templates/common-sections'

// ============================================
// 求职信生成 System Prompt
// ============================================

export const COVER_LETTER_SYSTEM_PROMPT = `${PERSONAS.WRITING_ASSISTANT}

你专门负责撰写个性化、有吸引力的求职信。`

// ============================================
// 求职信生成 User Prompt 模板
// ============================================

export const COVER_LETTER_USER_PROMPT = `你是一位专业的求职顾问，擅长撰写个性化的求职信。请根据以下信息，生成一封针对性强、专业且有吸引力的求职信。

## 求职者信息
姓名：{{candidateName}}
专业摘要：{{professionalSummary}}

### 工作经历
{{workExperience}}

### 技能
{{skills}}

## 目标岗位
岗位：{{jobTitle}}
公司：{{company}}
地点：{{jobLocation}}

岗位描述：
{{jobDescription}}

岗位要求：
{{jobRequirements}}

## 写作要求
1. **开篇吸引**：用一个有力的开头说明你对这个岗位的热情和适合度
2. **突出匹配**：重点强调你的经验和技能如何匹配岗位要求
3. **具体实例**：用具体的成就和数据来证明你的能力
4. **公司了解**：展示你对公司的了解和加入的动机
5. **结尾有力**：以积极的行动召唤结束

## 格式要求
- 语言：{{language}}
- 语气：{{tone}}
- 长度：250-400字
- 结构：3-4段

${OUTPUT_FORMAT_INSTRUCTIONS.COVER_LETTER}

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

// ============================================
// 求职信生成 Prompt 模板定义
// ============================================

export const COVER_LETTER_TEMPLATE: PromptTemplate = {
  id: 'cover-letter',
  name: '求职信生成',
  description: '根据用户资料和岗位信息生成个性化求职信',
  version: '1.0.0',
  systemPrompt: COVER_LETTER_SYSTEM_PROMPT,
  userPromptTemplate: COVER_LETTER_USER_PROMPT,
  temperature: 0.7, // 稍高的温度增加创意
  maxTokens: 2000,
  outputFormat: 'json',
  variables: [
    { name: 'candidateName', description: '候选人姓名', required: true, type: 'string' },
    { name: 'professionalSummary', description: '专业摘要', required: false, type: 'string' },
    { name: 'workExperience', description: '工作经历', required: false, type: 'string' },
    { name: 'skills', description: '技能列表', required: false, type: 'string' },
    { name: 'jobTitle', description: '岗位标题', required: true, type: 'string' },
    { name: 'company', description: '公司名称', required: true, type: 'string' },
    { name: 'jobLocation', description: '工作地点', required: false, type: 'string' },
    { name: 'jobDescription', description: '岗位描述', required: false, type: 'string' },
    { name: 'jobRequirements', description: '岗位要求', required: false, type: 'string' },
    { name: 'language', description: '输出语言', required: false, type: 'string', defaultValue: '英文' },
    { name: 'tone', description: '语气风格', required: false, type: 'string', defaultValue: '专业' },
  ],
}

// ============================================
// 求职信输出Schema
// ============================================

export interface CoverLetterOutput {
  content: string
  highlights: string[]
  wordCount: number
}

// ============================================
// 构建求职信生成Prompt的辅助函数
// ============================================

export interface CoverLetterInput {
  profile: {
    fullName: string
    professionalSummary?: string
  }
  workExperiences: Array<{
    company: string
    position: string
    startDate: string
    endDate?: string
    isCurrent: boolean
    description?: string
    achievements?: string[]
    technologies?: string[]
  }>
  skills: Array<{
    name: string
    level?: string
  }>
  job: {
    title: string
    company: string
    location?: string
    description?: string
    requirements?: string
  }
  tone?: 'professional' | 'friendly' | 'formal'
  language?: 'en' | 'zh'
}

export function buildCoverLetterPrompt(input: CoverLetterInput): string {
  const { profile, workExperiences, skills, job, tone = 'professional', language = 'en' } = input

  // 格式化工作经历
  const workExpStr = workExperiences
    .map(
      (w) =>
        `- ${w.position} @ ${w.company} (${w.startDate} - ${w.isCurrent ? '至今' : w.endDate})
  ${w.description || ''}
  成就: ${w.achievements?.join('; ') || '无'}
  技术: ${w.technologies?.join(', ') || '无'}`
    )
    .join('\n\n')

  // 格式化技能
  const skillsStr = skills.map((s) => `${s.name}${s.level ? ` (${s.level})` : ''}`).join(', ')

  // 语气和语言映射
  const toneMap = {
    formal: '正式',
    friendly: '友好',
    professional: '专业',
  }
  const languageMap = {
    en: '英文',
    zh: '中文',
  }

  return COVER_LETTER_USER_PROMPT
    .replace('{{candidateName}}', profile.fullName)
    .replace('{{professionalSummary}}', profile.professionalSummary || '无')
    .replace('{{workExperience}}', workExpStr || '无')
    .replace('{{skills}}', skillsStr || '无')
    .replace('{{jobTitle}}', job.title)
    .replace('{{company}}', job.company)
    .replace('{{jobLocation}}', job.location || '未指定')
    .replace('{{jobDescription}}', job.description || '无')
    .replace('{{jobRequirements}}', job.requirements || '无')
    .replace('{{language}}', languageMap[language])
    .replace('{{tone}}', toneMap[tone])
}

// ============================================
// 解析求职信输出
// ============================================

export function parseCoverLetterOutput(responseText: string): CoverLetterOutput | null {
  try {
    // 尝试直接解析JSON
    let jsonStr = responseText
    const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
    if (jsonMatch) {
      jsonStr = jsonMatch[1]
    }

    const parsed = JSON.parse(jsonStr.trim()) as CoverLetterOutput
    return {
      content: parsed.content || '',
      highlights: parsed.highlights || [],
      wordCount: parsed.wordCount || parsed.content?.length || 0,
    }
  } catch {
    // 尝试提取JSON
    try {
      const match = responseText.match(/\{[\s\S]*\}/)
      if (match) {
        const parsed = JSON.parse(match[0]) as CoverLetterOutput
        return {
          content: parsed.content || '',
          highlights: parsed.highlights || [],
          wordCount: parsed.wordCount || parsed.content?.length || 0,
        }
      }
    } catch {
      // 如果还是失败，返回原始文本
    }

    // 回退：将响应作为内容返回
    return {
      content: responseText,
      highlights: [],
      wordCount: responseText.length,
    }
  }
}
