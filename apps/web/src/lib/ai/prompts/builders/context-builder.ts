/**
 * 上下文构建工具
 *
 * 用于聚合和格式化 AI 助手的上下文信息
 */

import type {
  PromptContext,
  PageContext,
  PageType,
  UserContext,
  ProfileContext,
  JobContext,
  ResumeContext,
  SessionContext,
} from '../types'

// ============================================
// 页面类型检测
// ============================================

/**
 * 从URL路径检测页面类型
 */
export function detectPageType(pathname: string): PageType {
  // 去除查询参数
  const path = pathname.split('?')[0]

  // 匹配规则（按优先级排序）
  const rules: Array<{ pattern: RegExp; type: PageType }> = [
    { pattern: /^\/jobs\/[^/]+\/analysis$/, type: 'job-analysis' },
    { pattern: /^\/jobs\/[^/]+\/cover-letter$/, type: 'job-cover-letter' },
    { pattern: /^\/jobs\/import$/, type: 'job-import' },
    { pattern: /^\/jobs\/[^/]+$/, type: 'job-detail' },
    { pattern: /^\/jobs$/, type: 'jobs' },
    { pattern: /^\/resumes\/[^/]+\/edit$/, type: 'resume-edit' },
    { pattern: /^\/resumes\/[^/]+$/, type: 'resume-detail' },
    { pattern: /^\/resumes$/, type: 'resumes' },
    { pattern: /^\/profile\/edit$/, type: 'profile-edit' },
    { pattern: /^\/profile\/upload$/, type: 'profile-upload' },
    { pattern: /^\/profile$/, type: 'profile' },
    { pattern: /^\/applications$/, type: 'applications' },
    { pattern: /^\/$/, type: 'dashboard' },
    { pattern: /^\/dashboard$/, type: 'dashboard' },
  ]

  for (const rule of rules) {
    if (rule.pattern.test(path)) {
      return rule.type
    }
  }

  return 'other'
}

/**
 * 从URL路径提取参数
 */
export function extractPathParams(pathname: string): Record<string, string> {
  const params: Record<string, string> = {}
  const path = pathname.split('?')[0]

  // 提取岗位ID
  const jobMatch = path.match(/\/jobs\/([^/]+)/)
  if (jobMatch && jobMatch[1] !== 'import' && jobMatch[1] !== 'new') {
    params.jobId = jobMatch[1]
  }

  // 提取简历ID
  const resumeMatch = path.match(/\/resumes\/([^/]+)/)
  if (resumeMatch && resumeMatch[1] !== 'new') {
    params.resumeId = resumeMatch[1]
  }

  return params
}

/**
 * 创建页面上下文
 */
export function createPageContext(pathname: string): PageContext {
  return {
    path: pathname,
    type: detectPageType(pathname),
    params: extractPathParams(pathname),
  }
}

// ============================================
// 上下文构建器
// ============================================

export class ContextBuilder {
  private context: PromptContext

  constructor(pathname: string) {
    this.context = {
      currentPage: createPageContext(pathname),
    }
  }

  /**
   * 设置用户上下文
   */
  withUser(user: UserContext | null): this {
    if (user) {
      this.context.user = user
    }
    return this
  }

  /**
   * 设置 Profile 上下文
   */
  withProfile(profile: ProfileContext | null): this {
    if (profile) {
      this.context.profile = profile
    }
    return this
  }

  /**
   * 设置岗位上下文
   */
  withJob(job: JobContext | null): this {
    if (job) {
      this.context.activeJob = job
    }
    return this
  }

  /**
   * 设置简历上下文
   */
  withResume(resume: ResumeContext | null): this {
    if (resume) {
      this.context.activeResume = resume
    }
    return this
  }

  /**
   * 设置分析会话上下文
   */
  withSession(session: SessionContext | null): this {
    if (session) {
      this.context.activeSession = session
    }
    return this
  }

  /**
   * 从数据库记录构建 Profile 上下文
   */
  withProfileFromDB(dbProfile: Record<string, unknown> | null): this {
    if (!dbProfile) return this

    this.context.profile = {
      id: String(dbProfile.id || ''),
      fullName: String(dbProfile.full_name || ''),
      email: dbProfile.email ? String(dbProfile.email) : undefined,
      phone: dbProfile.phone ? String(dbProfile.phone) : undefined,
      location: dbProfile.location ? String(dbProfile.location) : undefined,
      professionalSummary: dbProfile.professional_summary
        ? String(dbProfile.professional_summary)
        : undefined,
      hasWorkExperience: Boolean(dbProfile.has_work_experience || dbProfile.work_experience_count),
      hasEducation: Boolean(dbProfile.has_education || dbProfile.education_count),
      hasSkills: Boolean(dbProfile.has_skills || dbProfile.skills_count),
    }

    return this
  }

  /**
   * 从数据库记录构建岗位上下文
   */
  withJobFromDB(dbJob: Record<string, unknown> | null): this {
    if (!dbJob) return this

    this.context.activeJob = {
      id: String(dbJob.id || ''),
      title: String(dbJob.title || ''),
      company: String(dbJob.company || ''),
      location: dbJob.location ? String(dbJob.location) : undefined,
      jobType: dbJob.job_type ? String(dbJob.job_type) : undefined,
      description: dbJob.description ? String(dbJob.description) : undefined,
      requirements: dbJob.requirements ? String(dbJob.requirements) : undefined,
      salaryMin: dbJob.salary_min ? Number(dbJob.salary_min) : undefined,
      salaryMax: dbJob.salary_max ? Number(dbJob.salary_max) : undefined,
      salaryCurrency: dbJob.salary_currency ? String(dbJob.salary_currency) : undefined,
    }

    return this
  }

  /**
   * 从数据库记录构建简历上下文
   */
  withResumeFromDB(dbResume: Record<string, unknown> | null): this {
    if (!dbResume) return this

    this.context.activeResume = {
      id: String(dbResume.id || ''),
      title: String(dbResume.title || ''),
      hasContent: Boolean(dbResume.content),
      lastUpdated: dbResume.updated_at ? String(dbResume.updated_at) : undefined,
    }

    return this
  }

  /**
   * 从数据库记录构建会话上下文
   */
  withSessionFromDB(dbSession: Record<string, unknown> | null): this {
    if (!dbSession) return this

    this.context.activeSession = {
      id: String(dbSession.id || ''),
      score: dbSession.score ? Number(dbSession.score) : undefined,
      recommendation: dbSession.recommendation ? String(dbSession.recommendation) : undefined,
      hasAnalysis: Boolean(dbSession.analysis),
    }

    return this
  }

  /**
   * 构建最终上下文
   */
  build(): PromptContext {
    return { ...this.context }
  }
}

// ============================================
// 便捷函数
// ============================================

/**
 * 创建空的上下文
 */
export function createEmptyContext(pathname: string = '/'): PromptContext {
  return new ContextBuilder(pathname).build()
}

/**
 * 快速创建完整上下文
 */
export function createFullContext(
  pathname: string,
  data: {
    user?: UserContext | null
    profile?: Record<string, unknown> | null
    job?: Record<string, unknown> | null
    resume?: Record<string, unknown> | null
    session?: Record<string, unknown> | null
  }
): PromptContext {
  return new ContextBuilder(pathname)
    .withUser(data.user || null)
    .withProfileFromDB(data.profile || null)
    .withJobFromDB(data.job || null)
    .withResumeFromDB(data.resume || null)
    .withSessionFromDB(data.session || null)
    .build()
}

// ============================================
// 上下文格式化（用于 Prompt）
// ============================================

/**
 * 将上下文格式化为字符串（用于 Prompt）
 */
export function formatContextForPrompt(context: PromptContext): string {
  const lines: string[] = []

  // 页面信息
  lines.push('### 当前页面')
  lines.push(`- 路径: ${context.currentPage.path}`)
  lines.push(`- 类型: ${getPageTypeLabel(context.currentPage.type)}`)
  if (context.currentPage.params && Object.keys(context.currentPage.params).length > 0) {
    lines.push(`- 参数: ${JSON.stringify(context.currentPage.params)}`)
  }

  // 用户信息
  if (context.user) {
    lines.push('')
    lines.push('### 用户')
    lines.push(`- 姓名: ${context.user.name || '未设置'}`)
    if (context.user.email) {
      lines.push(`- 邮箱: ${context.user.email}`)
    }
  }

  // Profile 信息
  if (context.profile) {
    lines.push('')
    lines.push('### 用户档案')
    lines.push(`- 姓名: ${context.profile.fullName}`)
    if (context.profile.location) {
      lines.push(`- 位置: ${context.profile.location}`)
    }
    if (context.profile.professionalSummary) {
      const summary = context.profile.professionalSummary
      lines.push(`- 职业摘要: ${summary.length > 100 ? summary.substring(0, 100) + '...' : summary}`)
    }
    lines.push(
      `- 档案完整度: 工作经历${context.profile.hasWorkExperience ? '✓' : '✗'} 教育${context.profile.hasEducation ? '✓' : '✗'} 技能${context.profile.hasSkills ? '✓' : '✗'}`
    )
  }

  // 当前岗位
  if (context.activeJob) {
    lines.push('')
    lines.push('### 当前岗位')
    lines.push(`- 标题: ${context.activeJob.title}`)
    lines.push(`- 公司: ${context.activeJob.company}`)
    if (context.activeJob.location) {
      lines.push(`- 地点: ${context.activeJob.location}`)
    }
    if (context.activeJob.jobType) {
      lines.push(`- 类型: ${context.activeJob.jobType}`)
    }
    if (context.activeJob.salaryMin && context.activeJob.salaryMax) {
      lines.push(
        `- 薪资: ${context.activeJob.salaryCurrency || 'NZD'} ${context.activeJob.salaryMin} - ${context.activeJob.salaryMax}`
      )
    }
    if (context.activeJob.description) {
      const desc = context.activeJob.description
      lines.push(`- 描述: ${desc.length > 200 ? desc.substring(0, 200) + '...' : desc}`)
    }
  }

  // 当前简历
  if (context.activeResume) {
    lines.push('')
    lines.push('### 当前简历')
    lines.push(`- 标题: ${context.activeResume.title}`)
    lines.push(`- 有内容: ${context.activeResume.hasContent ? '是' : '否'}`)
    if (context.activeResume.lastUpdated) {
      lines.push(`- 最后更新: ${context.activeResume.lastUpdated}`)
    }
  }

  // 分析会话
  if (context.activeSession) {
    lines.push('')
    lines.push('### 分析会话')
    if (context.activeSession.score !== undefined) {
      lines.push(`- 匹配分数: ${context.activeSession.score}`)
    }
    if (context.activeSession.recommendation) {
      lines.push(`- 推荐等级: ${context.activeSession.recommendation}`)
    }
    lines.push(`- 已有分析: ${context.activeSession.hasAnalysis ? '是' : '否'}`)
  }

  return lines.join('\n')
}

/**
 * 获取页面类型的中文标签
 */
function getPageTypeLabel(type: PageType): string {
  const labels: Record<PageType, string> = {
    dashboard: '仪表盘',
    jobs: '岗位列表',
    'job-detail': '岗位详情',
    'job-analysis': '岗位分析',
    'job-cover-letter': '求职信生成',
    'job-import': '岗位导入',
    resumes: '简历列表',
    'resume-detail': '简历详情',
    'resume-edit': '简历编辑',
    profile: '个人档案',
    'profile-upload': '简历上传',
    applications: '申请记录',
    other: '其他页面',
  }
  return labels[type] || type
}
