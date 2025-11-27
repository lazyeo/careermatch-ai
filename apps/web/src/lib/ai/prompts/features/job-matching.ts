/**
 * 岗位匹配分析 Prompt
 *
 * 用于分析简历与岗位的匹配程度
 */

import type { PromptTemplate } from '../types'
import { PERSONAS } from '../templates/system-personas'
import {
  ANALYSIS_FRAMEWORKS,
  SCORING_RULES,
  ANALYSIS_PRINCIPLES,
  LANGUAGE_HINTS,
} from '../templates/common-sections'

// ============================================
// 岗位匹配分析 System Prompt
// ============================================

export const JOB_MATCHING_SYSTEM_PROMPT = `${PERSONAS.CAREER_CONSULTANT}

你将进行深度的简历-岗位匹配分析，拥有自主权决定分析哪些维度、如何深入。

${LANGUAGE_HINTS.CHINESE}

**输出格式要求**：请严格使用分隔符格式输出，不要使用JSON格式。格式如下：
---SCORE---
<分数>
---RECOMMENDATION---
<推荐等级>
---ANALYSIS---
<Markdown分析报告>
---END---

这种格式可以让你自由使用任何Markdown语法，包括引号、代码块等。`

// ============================================
// 岗位匹配分析 User Prompt 模板
// ============================================

export const JOB_MATCHING_USER_PROMPT = `请对以下求职者与目标岗位进行深度匹配分析。

## 岗位信息
- **职位**: {{jobTitle}}
- **公司**: {{company}}
- **地点**: {{jobLocation}}
- **类型**: {{jobType}}
- **薪资范围**: {{salaryRange}}
- **岗位描述**:
{{jobDescription}}

- **岗位要求**:
{{jobRequirements}}

- **福利待遇**:
{{jobBenefits}}

---

## 求职者简历
- **姓名**: {{candidateName}}
- **位置**: {{candidateLocation}}
- **求职目标**: {{careerObjective}}
- **技能**: {{skills}}
- **工作经历**: {{workExperience}}
- **教育背景**: {{education}}
- **项目经验**: {{projects}}
- **证书**: {{certifications}}

---

${ANALYSIS_FRAMEWORKS.NINE_DIMENSION}

---

${ANALYSIS_PRINCIPLES.OBJECTIVE}

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

${SCORING_RULES.LEVELS}

---

## 输出格式（重要！请严格遵循）

请使用以下**分隔符格式**输出，不要使用纯JSON：

\`\`\`
---SCORE---
<0-100的整数>
---RECOMMENDATION---
<STRONG_MATCH|GOOD_MATCH|MODERATE_MATCH|WEAK_MATCH|NOT_RECOMMENDED>
---ANALYSIS---
<Markdown格式的详细分析报告，可以自由使用任何Markdown语法>
---END---
\`\`\`

说明：
- SCORE: 0-100的匹配度评分
- RECOMMENDATION: 推荐等级
  - STRONG_MATCH (85-100): 强烈推荐申请
  - GOOD_MATCH (70-84): 值得尝试
  - MODERATE_MATCH (55-69): 有一定机会
  - WEAK_MATCH (40-54): 差距较大
  - NOT_RECOMMENDED (0-39): 不建议申请
- ANALYSIS: Markdown格式的完整分析报告

**重要**：
1. 必须使用上述分隔符格式，每个分隔符占单独一行
2. ANALYSIS部分可以包含任何Markdown内容，包括引号、代码块、表格等
3. 以---END---结束输出`

// ============================================
// 岗位匹配分析 Prompt 模板定义
// ============================================

export const JOB_MATCHING_TEMPLATE: PromptTemplate = {
  id: 'job-matching',
  name: '岗位匹配分析',
  description: '分析简历与岗位的匹配程度，提供详细的分析报告',
  version: '1.0.0',
  systemPrompt: JOB_MATCHING_SYSTEM_PROMPT,
  userPromptTemplate: JOB_MATCHING_USER_PROMPT,
  temperature: 0.7, // 平衡准确性与创意
  maxTokens: 8192,
  outputFormat: 'delimiter',
  variables: [
    { name: 'jobTitle', description: '岗位标题', required: true, type: 'string' },
    { name: 'company', description: '公司名称', required: true, type: 'string' },
    { name: 'jobLocation', description: '工作地点', required: false, type: 'string' },
    { name: 'jobType', description: '岗位类型', required: false, type: 'string' },
    { name: 'salaryRange', description: '薪资范围', required: false, type: 'string' },
    { name: 'jobDescription', description: '岗位描述', required: false, type: 'string' },
    { name: 'jobRequirements', description: '岗位要求', required: false, type: 'string' },
    { name: 'jobBenefits', description: '福利待遇', required: false, type: 'string' },
    { name: 'candidateName', description: '候选人姓名', required: true, type: 'string' },
    { name: 'candidateLocation', description: '候选人位置', required: false, type: 'string' },
    { name: 'careerObjective', description: '职业目标', required: false, type: 'string' },
    { name: 'skills', description: '技能列表', required: false, type: 'json' },
    { name: 'workExperience', description: '工作经历', required: false, type: 'json' },
    { name: 'education', description: '教育背景', required: false, type: 'json' },
    { name: 'projects', description: '项目经验', required: false, type: 'json' },
    { name: 'certifications', description: '证书', required: false, type: 'json' },
  ],
}

// ============================================
// 岗位匹配分析输出Schema
// ============================================

export type MatchRecommendation =
  | 'STRONG_MATCH'
  | 'GOOD_MATCH'
  | 'MODERATE_MATCH'
  | 'WEAK_MATCH'
  | 'NOT_RECOMMENDED'

export interface JobMatchingOutput {
  score: number
  recommendation: MatchRecommendation
  analysis: string // Markdown格式的分析报告
}

// ============================================
// 构建岗位匹配分析Prompt的辅助函数
// ============================================

export interface JobMatchingInput {
  job: {
    title: string
    company: string
    location?: string
    job_type?: string
    salary_min?: number
    salary_max?: number
    salary_currency?: string
    description?: string
    requirements?: string
    benefits?: string
  }
  resume: {
    fullName: string
    location?: string
    careerObjective?: string
    skills?: unknown[]
    workExperience?: unknown[]
    education?: unknown[]
    projects?: unknown[]
    certifications?: unknown[]
  }
}

export function buildJobMatchingPrompt(input: JobMatchingInput): string {
  const { job, resume } = input

  const salaryRange =
    job.salary_min && job.salary_max
      ? `${job.salary_currency || 'NZD'} ${job.salary_min} - ${job.salary_max}`
      : '未指定'

  return JOB_MATCHING_USER_PROMPT
    .replace('{{jobTitle}}', job.title)
    .replace('{{company}}', job.company)
    .replace('{{jobLocation}}', job.location || '未指定')
    .replace('{{jobType}}', job.job_type || '未指定')
    .replace('{{salaryRange}}', salaryRange)
    .replace('{{jobDescription}}', job.description || '未提供')
    .replace('{{jobRequirements}}', job.requirements || '未提供')
    .replace('{{jobBenefits}}', job.benefits || '未提供')
    .replace('{{candidateName}}', resume.fullName)
    .replace('{{candidateLocation}}', resume.location || '未指定')
    .replace('{{careerObjective}}', resume.careerObjective || '未提供')
    .replace('{{skills}}', JSON.stringify(resume.skills || [], null, 2))
    .replace('{{workExperience}}', JSON.stringify(resume.workExperience || [], null, 2))
    .replace('{{education}}', JSON.stringify(resume.education || [], null, 2))
    .replace('{{projects}}', JSON.stringify(resume.projects || [], null, 2))
    .replace('{{certifications}}', JSON.stringify(resume.certifications || [], null, 2))
}

// ============================================
// 解析岗位匹配分析输出
// ============================================

export function parseJobMatchingOutput(responseText: string): JobMatchingOutput | null {
  // 检查是否使用分隔符格式
  if (!responseText.includes('---SCORE---') || !responseText.includes('---ANALYSIS---')) {
    return null
  }

  // 提取分数
  const scoreMatch = responseText.match(/---SCORE---\s*(\d+)/i)
  if (!scoreMatch) return null
  const score = Math.max(0, Math.min(100, parseInt(scoreMatch[1], 10)))

  // 提取推荐等级
  const recMatch = responseText.match(
    /---RECOMMENDATION---\s*(STRONG_MATCH|GOOD_MATCH|MODERATE_MATCH|WEAK_MATCH|NOT_RECOMMENDED)/i
  )
  const recommendation = (recMatch
    ? recMatch[1].toUpperCase()
    : score >= 85
      ? 'STRONG_MATCH'
      : score >= 70
        ? 'GOOD_MATCH'
        : score >= 55
          ? 'MODERATE_MATCH'
          : score >= 40
            ? 'WEAK_MATCH'
            : 'NOT_RECOMMENDED') as MatchRecommendation

  // 提取分析内容
  const analysisMatch = responseText.match(/---ANALYSIS---\s*([\s\S]*?)(?:---END---|$)/i)
  if (!analysisMatch || !analysisMatch[1]) return null

  const analysis = analysisMatch[1].trim()
  if (analysis.length < 50) return null

  return { score, recommendation, analysis }
}
