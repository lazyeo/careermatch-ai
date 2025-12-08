/**
 * 岗位匹配分析 Prompt V2 - 8维度增强版
 *
 * Phase 3: 智能增强 - 输出结构化的8维度分析数据
 *
 * 与v1的主要区别:
 * 1. 输出包含完整的8维度结构化数据
 * 2. CV策略是核心输出，直接指导简历生成
 * 3. 面试准备提供具体的STAR格式故事
 * 4. 关键词分析更细致，支持ATS优化
 */

import type { PromptTemplate } from '../types'
import { PERSONAS } from '../templates/system-personas'
import { LANGUAGE_HINTS } from '../templates/common-sections'
import type {
  AnalysisDimensions,
  CVStrategy,
  CVTone,
  ResumeSectionPriority,
} from '@careermatch/shared'

// ============================================
// 8维度分析 System Prompt
// ============================================

export const JOB_MATCHING_V2_SYSTEM_PROMPT = `${PERSONAS.CAREER_CONSULTANT}

你将进行深度的8维度简历-岗位匹配分析。你的分析将直接用于:
1. 生成针对性的简历（通过CV策略）
2. 准备面试（通过面试准备模块）
3. 帮助候选人了解自己的定位

${LANGUAGE_HINTS.CHINESE}

**输出格式要求**：请严格使用分隔符格式输出。格式如下：
---SCORE---
<分数>
---RECOMMENDATION---
<推荐等级>
---DIMENSIONS---
<8维度JSON数据>
---ANALYSIS---
<Markdown分析报告>
---END---

这种格式可以让你自由使用任何Markdown语法，同时提供结构化数据。`

// ============================================
// 8维度分析 User Prompt 模板
// ============================================

export const JOB_MATCHING_V2_USER_PROMPT = `请对以下求职者与目标岗位进行**8维度深度匹配分析**。

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

## 求职者档案
- **姓名**: {{candidateName}}
- **位置**: {{candidateLocation}}
- **求职目标**: {{careerObjective}}
- **技能**: {{skills}}
- **工作经历**: {{workExperience}}
- **教育背景**: {{education}}
- **项目经验**: {{projects}}
- **证书**: {{certifications}}

---

## 8维度分析框架

请从以下8个维度进行分析，每个维度都需要输出结构化数据：

### 1. 角色定位 (Role Positioning)
- 岗位级别和定位
- 候选人当前水平与目标的差距
- 职业发展路径匹配度

### 2. 核心职责 (Core Responsibilities)
- 主要职责与候选人经验的对应
- 职责覆盖率评估

### 3. 关键词匹配 (Keyword Matching)
- 技术关键词、软技能、行业术语
- ATS友好度评估
- 缺失的关键词建议

### 4. 关键要求 (Key Requirements)
- 必需要求 vs 加分项
- 候选人满足情况
- 主要差距识别

### 5. SWOT分析 (SWOT Analysis)
- 优势: 候选人的强项
- 劣势: 需要改进的地方
- 机会: 这个岗位带来的发展机会
- 威胁: 潜在的挑战和风险

### 6. CV策略 (CV Strategy) ⭐ 核心
**这是最重要的输出**，将直接用于生成针对性简历：
- 章节推荐顺序
- 各章节权重（决定详细程度）
- 应突出的项目和技能
- 每段经历的描述指导
- 应淡化/省略的内容
- 推荐的语气和风格

### 7. 面试准备 (Interview Preparation)
- 可能的面试问题（含回答要点）
- 需要准备的项目故事（STAR格式）
- 需要复习的技术点
- 面试建议

### 8. 匹配度评分 (Match Score)
- 总分和分项得分
- 推荐等级
- 置信度

---

## 输出格式（重要！请严格遵循）

请使用以下**分隔符格式**输出：

\`\`\`
---SCORE---
<0-100的整数>
---RECOMMENDATION---
<strong_match|good_match|moderate_match|weak_match|not_recommended>
---DIMENSIONS---
<8维度结构化JSON数据，见下方格式>
---ANALYSIS---
<Markdown格式的详细分析报告>
---END---
\`\`\`

### DIMENSIONS JSON格式示例

\`\`\`json
{
  "rolePositioning": {
    "summary": "中高级前端工程师岗位，需要5年+经验",
    "level": "senior",
    "domain": "前端开发",
    "primaryFunction": "构建和维护大规模Web应用",
    "candidateFit": {
      "currentLevel": "中级前端工程师",
      "targetLevel": "高级前端工程师",
      "gap": "需要更多的团队领导经验",
      "readiness": "stretch"
    }
  },
  "coreResponsibilities": {
    "responsibilities": [
      {
        "description": "开发React应用",
        "importance": "critical",
        "candidateEvidence": "在XX公司3年React开发经验",
        "matchStatus": "strong"
      }
    ],
    "coverageScore": 75,
    "summary": "候选人覆盖了大部分核心职责"
  },
  "keywordMatching": {
    "keywords": [
      {
        "keyword": "React",
        "category": "technical",
        "importance": "required",
        "found": true,
        "context": "3年React开发经验"
      }
    ],
    "requiredMatchRate": 80,
    "overallMatchRate": 70,
    "atsFriendliness": "good",
    "suggestedAdditions": ["TypeScript", "Jest"]
  },
  "keyRequirements": {
    "requirements": [
      {
        "description": "5年以上前端开发经验",
        "type": "experience",
        "mandatory": true,
        "met": false,
        "gap": "候选人有3年经验，差距2年"
      }
    ],
    "mandatoryFulfillmentRate": 70,
    "overallFulfillmentRate": 75,
    "majorGaps": ["经验年限不足"],
    "majorStrengths": ["技术栈匹配度高"]
  },
  "swotAnalysis": {
    "strengths": [
      {"point": "React技术深度强", "evidence": "主导过多个大型项目", "impact": "high"}
    ],
    "weaknesses": [
      {"point": "团队管理经验少", "suggestion": "可强调项目中的协作领导经历", "severity": "moderate"}
    ],
    "opportunities": [
      {"point": "可以接触大规模系统", "timeframe": "short_term"}
    ],
    "threats": [
      {"point": "可能面临经验质疑", "mitigation": "准备详细的项目成果数据", "likelihood": "medium"}
    ],
    "overallAssessment": "整体匹配度良好，建议申请"
  },
  "cvStrategy": {
    "priorityOrder": ["header", "summary", "skills", "experience", "projects", "education"],
    "emphasis": {
      "skills": 90,
      "experience": 85,
      "projects": 80,
      "education": 40
    },
    "projectFocus": ["电商平台重构", "性能优化项目"],
    "skillsHighlight": ["React", "TypeScript", "性能优化", "团队协作"],
    "experienceFraming": {
      "work_0": "强调技术决策和架构贡献",
      "work_1": "突出项目成果和团队协作"
    },
    "avoid": ["不相关的后端经验", "过时的jQuery项目"],
    "tone": "technical",
    "objectiveGuidance": "强调对大规模应用的热情和技术深度",
    "quantificationSuggestions": ["添加性能提升百分比", "用户数量级"],
    "actionVerbs": ["主导", "优化", "架构", "实现", "推动"]
  },
  "interviewPreparation": {
    "likelyQuestions": [
      {
        "question": "描述一个你优化过的复杂React应用",
        "type": "technical",
        "difficulty": "intermediate",
        "answerPoints": ["背景", "技术方案", "结果数据"],
        "relevantExperience": "电商平台性能优化项目"
      }
    ],
    "questionsToAsk": ["团队的技术栈演进计划是什么？"],
    "technicalReview": ["React性能优化", "状态管理模式"],
    "projectStories": [
      {
        "project": "电商平台重构",
        "angle": "技术决策能力",
        "starFormat": {
          "situation": "旧系统性能问题",
          "task": "主导技术方案选型",
          "action": "引入微前端架构",
          "result": "性能提升40%"
        }
      }
    ],
    "tips": ["准备具体的数据支撑", "展示技术热情"]
  },
  "matchScore": {
    "overall": 75,
    "breakdown": {
      "skillsScore": 85,
      "experienceScore": 70,
      "educationScore": 80,
      "cultureFitScore": 75,
      "careerFitScore": 80
    },
    "confidence": "high",
    "recommendation": "good_match",
    "summary": "技能匹配度高，经验略有差距，整体值得申请"
  }
}
\`\`\`

### ANALYSIS部分要求

Markdown分析报告应包含：
1. **执行摘要** - 一句话评估
2. **核心发现** - 3-5个关键洞察
3. **申请建议** - 是否申请及原因
4. **简历优化重点** - 针对这个岗位的简历建议
5. **面试准备重点** - 需要特别准备的方面

---

## 评分标准

- **strong_match (85-100)**: 高度匹配，强烈推荐申请
- **good_match (70-84)**: 良好匹配，值得尝试
- **moderate_match (55-69)**: 一般匹配，有一定机会
- **weak_match (40-54)**: 匹配度低，差距较大
- **not_recommended (0-39)**: 不建议申请

---

**重要提示**：
1. CV策略是最重要的输出，会直接用于生成简历
2. 面试问题要具体、可操作
3. 所有建议要基于候选人的实际情况
4. 如果信息不足，可以标注"信息不足"并给出合理推测`

// ============================================
// 岗位匹配分析 V2 Prompt 模板定义
// ============================================

export const JOB_MATCHING_V2_TEMPLATE: PromptTemplate = {
  id: 'job-matching-v2',
  name: '8维度岗位匹配分析',
  description: '深度8维度分析，输出结构化CV策略和面试准备',
  version: '2.0.0',
  systemPrompt: JOB_MATCHING_V2_SYSTEM_PROMPT,
  userPromptTemplate: JOB_MATCHING_V2_USER_PROMPT,
  temperature: 0.7,
  maxTokens: 16384, // 需要更多token来输出完整的8维度数据
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
// V2输出类型
// ============================================

export interface JobMatchingV2Output {
  score: number
  recommendation:
    | 'strong_match'
    | 'good_match'
    | 'moderate_match'
    | 'weak_match'
    | 'not_recommended'
  dimensions: AnalysisDimensions
  analysis: string // Markdown格式的分析报告
}

// ============================================
// 构建V2 Prompt的辅助函数
// ============================================

export interface JobMatchingV2Input {
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
  profile: {
    fullName: string
    location?: string
    careerObjective?: string
    skills?: Array<{ name: string; level?: string; category?: string }>
    workExperience?: Array<{
      company: string
      position: string
      startDate: string
      endDate?: string
      isCurrent?: boolean
      description?: string
      achievements?: string[]
    }>
    education?: Array<{
      institution: string
      degree: string
      major?: string
      startDate?: string
      endDate?: string
      gpa?: number
    }>
    projects?: Array<{
      name: string
      description?: string
      technologies?: string[]
      highlights?: string[]
    }>
    certifications?: Array<{
      name: string
      issuer?: string
      issueDate?: string
    }>
  }
}

export function buildJobMatchingV2Prompt(input: JobMatchingV2Input): string {
  const { job, profile } = input

  const salaryRange =
    job.salary_min && job.salary_max
      ? `${job.salary_currency || 'NZD'} ${job.salary_min.toLocaleString()} - ${job.salary_max.toLocaleString()}`
      : '未指定'

  return JOB_MATCHING_V2_USER_PROMPT.replace('{{jobTitle}}', job.title)
    .replace('{{company}}', job.company)
    .replace('{{jobLocation}}', job.location || '未指定')
    .replace('{{jobType}}', job.job_type || '未指定')
    .replace('{{salaryRange}}', salaryRange)
    .replace('{{jobDescription}}', job.description || '未提供')
    .replace('{{jobRequirements}}', job.requirements || '未提供')
    .replace('{{jobBenefits}}', job.benefits || '未提供')
    .replace('{{candidateName}}', profile.fullName)
    .replace('{{candidateLocation}}', profile.location || '未指定')
    .replace('{{careerObjective}}', profile.careerObjective || '未提供')
    .replace('{{skills}}', JSON.stringify(profile.skills || [], null, 2))
    .replace('{{workExperience}}', JSON.stringify(profile.workExperience || [], null, 2))
    .replace('{{education}}', JSON.stringify(profile.education || [], null, 2))
    .replace('{{projects}}', JSON.stringify(profile.projects || [], null, 2))
    .replace('{{certifications}}', JSON.stringify(profile.certifications || [], null, 2))
}

// ============================================
// 解析V2输出
// ============================================

export function parseJobMatchingV2Output(responseText: string): JobMatchingV2Output | null {
  // 检查是否使用分隔符格式
  if (!responseText.includes('---SCORE---') || !responseText.includes('---DIMENSIONS---')) {
    console.warn('V2解析失败: 缺少必需的分隔符')
    return null
  }

  // 提取分数
  const scoreMatch = responseText.match(/---SCORE---\s*(\d+)/i)
  if (!scoreMatch) {
    console.warn('V2解析失败: 无法提取分数')
    return null
  }
  const score = Math.max(0, Math.min(100, parseInt(scoreMatch[1], 10)))

  // 提取推荐等级
  const recMatch = responseText.match(
    /---RECOMMENDATION---\s*(strong_match|good_match|moderate_match|weak_match|not_recommended)/i
  )
  const recommendation = (
    recMatch
      ? recMatch[1].toLowerCase()
      : score >= 85
        ? 'strong_match'
        : score >= 70
          ? 'good_match'
          : score >= 55
            ? 'moderate_match'
            : score >= 40
              ? 'weak_match'
              : 'not_recommended'
  ) as JobMatchingV2Output['recommendation']

  // 提取8维度数据
  const dimensionsMatch = responseText.match(/---DIMENSIONS---\s*([\s\S]*?)(?:---ANALYSIS---|$)/i)
  if (!dimensionsMatch || !dimensionsMatch[1]) {
    console.warn('V2解析失败: 无法提取DIMENSIONS')
    return null
  }

  let dimensions: AnalysisDimensions
  try {
    // 清理JSON字符串（移除可能的markdown代码块标记）
    let jsonStr = dimensionsMatch[1].trim()
    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.slice(7)
    }
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.slice(3)
    }
    if (jsonStr.endsWith('```')) {
      jsonStr = jsonStr.slice(0, -3)
    }
    jsonStr = jsonStr.trim()

    dimensions = JSON.parse(jsonStr)
  } catch (e) {
    console.warn('V2解析失败: DIMENSIONS JSON解析错误', e)
    return null
  }

  // 提取分析内容
  const analysisMatch = responseText.match(/---ANALYSIS---\s*([\s\S]*?)(?:---END---|$)/i)
  const analysis = analysisMatch ? analysisMatch[1].trim() : ''

  return { score, recommendation, dimensions, analysis }
}

// ============================================
// 提取CV策略（用于简历生成）
// ============================================

export function extractCVStrategy(output: JobMatchingV2Output): CVStrategy | null {
  if (!output.dimensions?.cvStrategy) {
    return null
  }
  return output.dimensions.cvStrategy
}

// ============================================
// 验证CV策略完整性
// ============================================

export function validateCVStrategy(strategy: CVStrategy): {
  valid: boolean
  missing: string[]
} {
  const missing: string[] = []

  if (!strategy.priorityOrder || strategy.priorityOrder.length === 0) {
    missing.push('priorityOrder')
  }
  if (!strategy.emphasis || Object.keys(strategy.emphasis).length === 0) {
    missing.push('emphasis')
  }
  if (!strategy.skillsHighlight || strategy.skillsHighlight.length === 0) {
    missing.push('skillsHighlight')
  }
  if (!strategy.tone) {
    missing.push('tone')
  }

  return {
    valid: missing.length === 0,
    missing,
  }
}

// ============================================
// 生成默认CV策略（当解析失败时使用）
// ============================================

export function generateDefaultCVStrategy(
  jobTitle: string,
  profileSkills: string[]
): CVStrategy {
  // 根据职位标题推断合适的语气
  const title = jobTitle.toLowerCase()
  let tone: CVTone = 'formal'
  if (
    title.includes('engineer') ||
    title.includes('developer') ||
    title.includes('architect')
  ) {
    tone = 'technical'
  } else if (
    title.includes('designer') ||
    title.includes('creative') ||
    title.includes('artist')
  ) {
    tone = 'creative'
  } else if (
    title.includes('director') ||
    title.includes('vp') ||
    title.includes('chief') ||
    title.includes('executive')
  ) {
    tone = 'executive'
  }

  const defaultOrder: ResumeSectionPriority[] = [
    'header',
    'summary',
    'skills',
    'experience',
    'projects',
    'education',
    'certifications',
  ]

  return {
    priorityOrder: defaultOrder,
    emphasis: {
      skills: 80,
      experience: 85,
      projects: 70,
      education: 50,
      certifications: 40,
    },
    projectFocus: [], // 需要根据实际项目选择
    skillsHighlight: profileSkills.slice(0, 8), // 取前8个技能
    experienceFraming: {},
    avoid: [],
    tone,
    objectiveGuidance: `针对${jobTitle}岗位，突出相关经验和技能`,
    quantificationSuggestions: ['添加具体数字和百分比', '量化项目成果'],
    actionVerbs: ['开发', '实现', '优化', '主导', '设计', '构建'],
  }
}
