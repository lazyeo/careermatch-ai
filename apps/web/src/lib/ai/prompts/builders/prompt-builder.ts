/**
 * Prompt 构建工具
 *
 * 提供统一的 Prompt 构建和变量替换功能
 */

import type { PromptTemplate, PromptVariable } from '../types'
import { getPromptTemplate, PROMPT_TEMPLATES } from '../features'

// ============================================
// Prompt 构建器
// ============================================

export interface PromptBuildResult {
  systemPrompt: string
  userPrompt: string
  temperature: number
  maxTokens: number
  outputFormat: PromptTemplate['outputFormat']
}

/**
 * 构建 Prompt
 *
 * @param templateId - 模板ID
 * @param variables - 变量值
 * @returns 构建结果
 */
export function buildPrompt(
  templateId: string,
  variables: Record<string, unknown>
): PromptBuildResult {
  const template = getPromptTemplate(templateId)

  if (!template) {
    throw new Error(`Unknown prompt template: ${templateId}`)
  }

  // 验证必需变量
  validateVariables(template, variables)

  // 替换变量
  const userPrompt = replaceVariables(template.userPromptTemplate, variables, template.variables)

  return {
    systemPrompt: template.systemPrompt,
    userPrompt,
    temperature: template.temperature,
    maxTokens: template.maxTokens,
    outputFormat: template.outputFormat,
  }
}

/**
 * 验证变量
 */
function validateVariables(
  template: PromptTemplate,
  variables: Record<string, unknown>
): void {
  for (const varDef of template.variables) {
    if (varDef.required && !(varDef.name in variables)) {
      // 检查是否有默认值
      if (varDef.defaultValue === undefined) {
        throw new Error(
          `Missing required variable "${varDef.name}" for template "${template.id}"`
        )
      }
    }
  }
}

/**
 * 替换变量
 *
 * 支持 {{variable}} 语法
 */
function replaceVariables(
  template: string,
  variables: Record<string, unknown>,
  varDefs: PromptVariable[]
): string {
  let result = template

  // 构建变量默认值映射
  const defaults: Record<string, unknown> = {}
  for (const varDef of varDefs) {
    if (varDef.defaultValue !== undefined) {
      defaults[varDef.name] = varDef.defaultValue
    }
  }

  // 合并默认值和提供的变量
  const mergedVars = { ...defaults, ...variables }

  // 替换所有 {{variable}} 模式
  result = result.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
    if (varName in mergedVars) {
      const value = mergedVars[varName]

      // 根据类型格式化
      if (value === null || value === undefined) {
        return '未提供'
      }
      if (typeof value === 'object') {
        return JSON.stringify(value, null, 2)
      }
      return String(value)
    }

    // 未找到变量，保留原样
    return match
  })

  return result
}

// ============================================
// 快捷构建函数
// ============================================

/**
 * 构建简历解析 Prompt
 */
export function buildResumeParsingPrompt(content: string): PromptBuildResult {
  return buildPrompt('resume-parsing', { content })
}

/**
 * 构建岗位解析 Prompt
 */
export function buildJobParsingPrompt(content: string): PromptBuildResult {
  return buildPrompt('job-parsing', { content })
}

/**
 * 构建岗位匹配分析 Prompt
 */
export function buildJobMatchingPrompt(
  job: Record<string, unknown>,
  resume: Record<string, unknown>
): PromptBuildResult {
  // 提取岗位信息
  const salaryRange =
    job.salary_min && job.salary_max
      ? `${job.salary_currency || 'NZD'} ${job.salary_min} - ${job.salary_max}`
      : '未指定'

  // 提取简历信息
  const resumeContent = (resume.content as Record<string, unknown>) || {}
  const personalInfo = (resumeContent.personal_info as Record<string, unknown>) || {}

  return buildPrompt('job-matching', {
    jobTitle: job.title,
    company: job.company,
    jobLocation: job.location || '未指定',
    jobType: job.job_type || '未指定',
    salaryRange,
    jobDescription: job.description || '未提供',
    jobRequirements: job.requirements || '未提供',
    jobBenefits: job.benefits || '未提供',
    candidateName:
      personalInfo.fullName || personalInfo.full_name || resume.full_name || 'Unknown',
    candidateLocation: personalInfo.location || resume.location || '未指定',
    careerObjective:
      resumeContent.careerObjective ||
      resumeContent.career_objective ||
      resume.objective ||
      '未提供',
    skills: resumeContent.skills || resume.skills || [],
    workExperience:
      resumeContent.workExperience || resumeContent.work_experience || resume.work_experience || [],
    education: resumeContent.education || resume.education || [],
    projects: resumeContent.projects || resume.projects || [],
    certifications: resumeContent.certifications || resume.certifications || [],
  })
}

/**
 * 构建求职信生成 Prompt
 */
export function buildCoverLetterPrompt(
  profile: {
    fullName: string
    professionalSummary?: string
  },
  workExperiences: Array<{
    company: string
    position: string
    startDate: string
    endDate?: string
    isCurrent: boolean
    description?: string
    achievements?: string[]
    technologies?: string[]
  }>,
  skills: Array<{ name: string; level?: string }>,
  job: {
    title: string
    company: string
    location?: string
    description?: string
    requirements?: string
  },
  options?: {
    tone?: 'professional' | 'friendly' | 'formal'
    language?: 'en' | 'zh'
  }
): PromptBuildResult {
  const { tone = 'professional', language = 'en' } = options || {}

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
  const toneMap = { formal: '正式', friendly: '友好', professional: '专业' }
  const languageMap = { en: '英文', zh: '中文' }

  return buildPrompt('cover-letter', {
    candidateName: profile.fullName,
    professionalSummary: profile.professionalSummary || '无',
    workExperience: workExpStr || '无',
    skills: skillsStr || '无',
    jobTitle: job.title,
    company: job.company,
    jobLocation: job.location || '未指定',
    jobDescription: job.description || '无',
    jobRequirements: job.requirements || '无',
    language: languageMap[language],
    tone: toneMap[tone],
  })
}

/**
 * 构建助手对话 Prompt
 */
export function buildAssistantChatPrompt(
  context: string,
  message: string
): PromptBuildResult {
  return buildPrompt('assistant-chat', { context, message })
}

// ============================================
// 模板信息查询
// ============================================

/**
 * 获取所有可用的模板ID
 */
export function getAvailableTemplateIds(): string[] {
  return Object.keys(PROMPT_TEMPLATES)
}

/**
 * 获取模板的变量定义
 */
export function getTemplateVariables(templateId: string): PromptVariable[] {
  const template = getPromptTemplate(templateId)
  return template?.variables || []
}

/**
 * 检查模板是否存在
 */
export function isTemplateAvailable(templateId: string): boolean {
  return templateId in PROMPT_TEMPLATES
}
