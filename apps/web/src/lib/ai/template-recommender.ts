/**
 * 智能模板推荐器
 *
 * Phase 3: 智能增强 - 基于岗位和CV策略自动推荐最佳模板
 *
 * 推荐算法:
 * 1. 职位类型匹配 - 根据职位标题推荐行业模板
 * 2. CV策略分析 - 根据emphasis权重推荐布局
 * 3. 语气匹配 - 根据tone推荐风格
 * 4. 公司类型推断 - 根据公司名称推荐风格
 */

import type { CVStrategy, CVTone } from '@careermatch/shared'

// =====================================================
// 模板类型定义
// =====================================================

export type TemplateId =
  | 'modern-blue'
  | 'classic-serif'
  | 'creative-gradient'
  | 'executive-minimal'
  | 'technical-dark'
  | 'tech-engineer'
  | 'finance-analyst'
  | 'creative-designer'

export interface TemplateRecommendation {
  /** 推荐的模板ID */
  templateId: TemplateId
  /** 推荐原因 */
  reason: string
  /** 置信度 (0-100) */
  confidence: number
  /** 备选模板 */
  alternatives: Array<{
    templateId: TemplateId
    reason: string
  }>
}

// =====================================================
// 职位类型到模板的映射规则
// =====================================================

interface JobTypeRule {
  keywords: string[]
  templateId: TemplateId
  confidence: number
}

const JOB_TYPE_RULES: JobTypeRule[] = [
  // 技术岗位
  {
    keywords: [
      'engineer',
      'developer',
      'programmer',
      'architect',
      '工程师',
      '开发',
      '程序员',
      '架构师',
      'devops',
      'sre',
      'backend',
      'frontend',
      'fullstack',
    ],
    templateId: 'tech-engineer',
    confidence: 85,
  },
  // 金融岗位
  {
    keywords: [
      'finance',
      'analyst',
      'accountant',
      'banker',
      '金融',
      '分析师',
      '会计',
      '银行',
      'investment',
      'trading',
      'risk',
    ],
    templateId: 'finance-analyst',
    confidence: 85,
  },
  // 设计岗位
  {
    keywords: [
      'designer',
      'ux',
      'ui',
      'creative',
      '设计师',
      '创意',
      'graphic',
      'visual',
      'art director',
    ],
    templateId: 'creative-designer',
    confidence: 85,
  },
  // 高管岗位
  {
    keywords: [
      'director',
      'vp',
      'vice president',
      'chief',
      'ceo',
      'cto',
      'cfo',
      'executive',
      '总监',
      '副总',
      '总裁',
      '首席',
    ],
    templateId: 'executive-minimal',
    confidence: 80,
  },
  // 产品岗位
  {
    keywords: [
      'product',
      'pm',
      'project manager',
      '产品',
      '项目经理',
      'scrum',
      'agile',
    ],
    templateId: 'modern-blue',
    confidence: 75,
  },
  // 销售/市场
  {
    keywords: [
      'sales',
      'marketing',
      'business development',
      '销售',
      '市场',
      '商务',
      'growth',
    ],
    templateId: 'modern-blue',
    confidence: 70,
  },
]

// =====================================================
// 公司类型到风格的映射
// =====================================================

interface CompanyStyleRule {
  keywords: string[]
  preferredStyle: 'modern' | 'classic' | 'creative' | 'formal'
}

const COMPANY_STYLE_RULES: CompanyStyleRule[] = [
  // 科技公司 - 现代风格
  {
    keywords: [
      'tech',
      'software',
      'google',
      'microsoft',
      'amazon',
      'meta',
      'apple',
      'startup',
      '科技',
      '互联网',
      'ai',
    ],
    preferredStyle: 'modern',
  },
  // 金融机构 - 正式风格
  {
    keywords: [
      'bank',
      'jp morgan',
      'goldman',
      'morgan stanley',
      'insurance',
      '银行',
      '证券',
      '保险',
    ],
    preferredStyle: 'formal',
  },
  // 咨询公司 - 正式风格
  {
    keywords: [
      'consulting',
      'mckinsey',
      'bcg',
      'bain',
      'deloitte',
      'pwc',
      'ey',
      'kpmg',
      '咨询',
    ],
    preferredStyle: 'formal',
  },
  // 创意公司 - 创意风格
  {
    keywords: [
      'agency',
      'studio',
      'creative',
      'design',
      '广告',
      '创意',
      '设计',
      'media',
    ],
    preferredStyle: 'creative',
  },
]

// =====================================================
// 智能推荐函数
// =====================================================

/**
 * 主推荐函数
 */
export function recommendTemplate(
  jobTitle: string,
  company: string,
  cvStrategy?: CVStrategy
): TemplateRecommendation {
  const candidates: Array<{
    templateId: TemplateId
    score: number
    reason: string
  }> = []

  // 1. 职位类型匹配
  const jobTypeMatch = matchJobType(jobTitle)
  if (jobTypeMatch) {
    candidates.push({
      templateId: jobTypeMatch.templateId,
      score: jobTypeMatch.confidence,
      reason: `职位类型匹配: ${jobTitle}`,
    })
  }

  // 2. CV策略分析
  if (cvStrategy) {
    const strategyMatch = matchCVStrategy(cvStrategy)
    if (strategyMatch) {
      candidates.push(strategyMatch)
    }
  }

  // 3. 公司风格推断
  const companyMatch = matchCompanyStyle(company)
  if (companyMatch) {
    candidates.push(companyMatch)
  }

  // 4. 如果没有匹配，使用默认
  if (candidates.length === 0) {
    candidates.push({
      templateId: 'modern-blue',
      score: 50,
      reason: '默认推荐',
    })
  }

  // 按分数排序
  candidates.sort((a, b) => b.score - a.score)

  const best = candidates[0]
  const alternatives = candidates
    .slice(1, 3)
    .map((c) => ({ templateId: c.templateId, reason: c.reason }))

  return {
    templateId: best.templateId,
    reason: best.reason,
    confidence: best.score,
    alternatives,
  }
}

/**
 * 匹配职位类型
 */
function matchJobType(
  jobTitle: string
): { templateId: TemplateId; confidence: number } | null {
  const lowerTitle = jobTitle.toLowerCase()

  for (const rule of JOB_TYPE_RULES) {
    const match = rule.keywords.some((keyword) =>
      lowerTitle.includes(keyword.toLowerCase())
    )
    if (match) {
      return {
        templateId: rule.templateId,
        confidence: rule.confidence,
      }
    }
  }

  return null
}

/**
 * 根据CV策略推荐
 */
function matchCVStrategy(
  cvStrategy: CVStrategy
): { templateId: TemplateId; score: number; reason: string } | null {
  // 根据tone推荐
  const toneTemplateMap: Record<CVTone, TemplateId> = {
    technical: 'tech-engineer',
    executive: 'executive-minimal',
    creative: 'creative-designer',
    conversational: 'modern-blue',
    formal: 'classic-serif',
  }

  if (cvStrategy.tone) {
    return {
      templateId: toneTemplateMap[cvStrategy.tone] || 'modern-blue',
      score: 70,
      reason: `语气风格匹配: ${cvStrategy.tone}`,
    }
  }

  // 根据emphasis权重推荐布局
  const emphasis = cvStrategy.emphasis || {}
  const projectsEmphasis = emphasis['projects'] || 0
  const experienceEmphasis = emphasis['experience'] || 0

  // 如果项目权重高，推荐适合展示项目的布局
  if (projectsEmphasis > 80) {
    return {
      templateId: 'creative-gradient',
      score: 65,
      reason: '项目重点展示',
    }
  }

  // 如果经验权重很高，推荐经验优先的布局
  if (experienceEmphasis > 90) {
    return {
      templateId: 'executive-minimal',
      score: 65,
      reason: '经验重点展示',
    }
  }

  return null
}

/**
 * 根据公司风格推荐
 */
function matchCompanyStyle(
  company: string
): { templateId: TemplateId; score: number; reason: string } | null {
  const lowerCompany = company.toLowerCase()

  for (const rule of COMPANY_STYLE_RULES) {
    const match = rule.keywords.some((keyword) =>
      lowerCompany.includes(keyword.toLowerCase())
    )
    if (match) {
      const styleTemplateMap: Record<string, TemplateId> = {
        modern: 'modern-blue',
        classic: 'classic-serif',
        creative: 'creative-gradient',
        formal: 'classic-serif',
      }

      return {
        templateId: styleTemplateMap[rule.preferredStyle] || 'modern-blue',
        score: 60,
        reason: `公司风格匹配: ${company}`,
      }
    }
  }

  return null
}

// =====================================================
// 模板信息
// =====================================================

export interface TemplateInfo {
  id: TemplateId
  name: string
  description: string
  bestFor: string[]
  layout: 'single-column' | 'two-column'
  style: 'modern' | 'classic' | 'creative' | 'professional'
}

export const TEMPLATE_INFO: Record<TemplateId, TemplateInfo> = {
  'modern-blue': {
    id: 'modern-blue',
    name: 'Modern Blue',
    description: '现代简约风格，适合大多数职位',
    bestFor: ['产品经理', '市场', '综合岗位'],
    layout: 'single-column',
    style: 'modern',
  },
  'classic-serif': {
    id: 'classic-serif',
    name: 'Classic Serif',
    description: '传统正式风格，适合正式行业',
    bestFor: ['金融', '法律', '咨询', '政府'],
    layout: 'single-column',
    style: 'classic',
  },
  'creative-gradient': {
    id: 'creative-gradient',
    name: 'Creative Gradient',
    description: '创意渐变风格，适合创意岗位',
    bestFor: ['设计师', '创意总监', '品牌'],
    layout: 'two-column',
    style: 'creative',
  },
  'executive-minimal': {
    id: 'executive-minimal',
    name: 'Executive Minimal',
    description: '极简高管风格，大量留白',
    bestFor: ['高管', '总监', '副总裁'],
    layout: 'single-column',
    style: 'professional',
  },
  'technical-dark': {
    id: 'technical-dark',
    name: 'Technical Dark',
    description: '深色技术风格，代码字体',
    bestFor: ['工程师', '开发者', 'DevOps'],
    layout: 'single-column',
    style: 'modern',
  },
  'tech-engineer': {
    id: 'tech-engineer',
    name: 'Tech Engineer',
    description: '技术工程师专用模板',
    bestFor: ['软件工程师', '后端开发', '架构师'],
    layout: 'single-column',
    style: 'modern',
  },
  'finance-analyst': {
    id: 'finance-analyst',
    name: 'Finance Analyst',
    description: '金融分析师专用模板',
    bestFor: ['金融分析师', '投资', '会计'],
    layout: 'single-column',
    style: 'professional',
  },
  'creative-designer': {
    id: 'creative-designer',
    name: 'Creative Designer',
    description: '创意设计师专用模板',
    bestFor: ['UI/UX设计师', '视觉设计', '创意总监'],
    layout: 'two-column',
    style: 'creative',
  },
}

/**
 * 获取模板详细信息
 */
export function getTemplateInfo(templateId: TemplateId): TemplateInfo {
  return TEMPLATE_INFO[templateId] || TEMPLATE_INFO['modern-blue']
}

/**
 * 获取所有模板
 */
export function getAllTemplates(): TemplateInfo[] {
  return Object.values(TEMPLATE_INFO)
}

/**
 * 根据风格筛选模板
 */
export function getTemplatesByStyle(
  style: TemplateInfo['style']
): TemplateInfo[] {
  return getAllTemplates().filter((t) => t.style === style)
}

/**
 * 根据布局筛选模板
 */
export function getTemplatesByLayout(
  layout: TemplateInfo['layout']
): TemplateInfo[] {
  return getAllTemplates().filter((t) => t.layout === layout)
}

// =====================================================
// 推荐解释生成
// =====================================================

/**
 * 生成推荐解释文本
 */
export function generateRecommendationExplanation(
  recommendation: TemplateRecommendation
): string {
  const info = getTemplateInfo(recommendation.templateId)

  let explanation = `推荐使用 **${info.name}** 模板。\n\n`
  explanation += `**推荐原因**: ${recommendation.reason}\n\n`
  explanation += `**适用场景**: ${info.bestFor.join('、')}\n\n`
  explanation += `**置信度**: ${recommendation.confidence}%\n\n`

  if (recommendation.alternatives.length > 0) {
    explanation += '**备选方案**:\n'
    recommendation.alternatives.forEach((alt) => {
      const altInfo = getTemplateInfo(alt.templateId)
      explanation += `- ${altInfo.name}: ${alt.reason}\n`
    })
  }

  return explanation
}
