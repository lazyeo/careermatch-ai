/**
 * CV策略驱动的简历内容优化器
 *
 * Phase 3: 智能增强 - 根据8维度分析的CV策略优化简历内容
 *
 * 核心功能:
 * 1. 根据CV策略筛选和排序简历内容
 * 2. 应用经历描述指导优化工作经历
 * 3. 根据emphasis权重决定各部分详细程度
 * 4. 过滤掉应避免的内容
 */

import type {
  CVStrategy,
  CVTone,
  FullProfile,
  UserProfile,
  UserSkill,
  UserProject,
  UserCertification,
  ResumeContent,
  PersonalInfo,
  Skill,
  WorkExperience as ResumeWorkExperience,
  Project as ResumeProject,
  Education as ResumeEducation,
  Certification as ResumeCertification,
  ProfileWorkExperience,
  EducationRecord,
} from '@careermatch/shared'

// =====================================================
// 优化后的简历内容类型
// =====================================================

export interface OptimizedResumeContent extends ResumeContent {
  /** 应用的CV策略 */
  appliedStrategy: CVStrategy
  /** 优化说明 */
  optimizationNotes: string[]
}

// =====================================================
// 优化配置
// =====================================================

export interface OptimizationConfig {
  /** 最大工作经历数量 */
  maxWorkExperiences: number
  /** 最大项目数量 */
  maxProjects: number
  /** 最大技能数量 */
  maxSkills: number
  /** 最大证书数量 */
  maxCertifications: number
  /** 是否包含职业目标 */
  includeObjective: boolean
}

const DEFAULT_CONFIG: OptimizationConfig = {
  maxWorkExperiences: 4,
  maxProjects: 3,
  maxSkills: 12,
  maxCertifications: 5,
  includeObjective: true,
}

// =====================================================
// 简历内容优化器
// =====================================================

export class ResumeContentOptimizer {
  private config: OptimizationConfig

  constructor(config: Partial<OptimizationConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  /**
   * 主入口：优化简历内容
   */
  optimizeContent(
    profile: FullProfile,
    cvStrategy: CVStrategy,
    jobTitle: string,
    company: string
  ): OptimizedResumeContent {
    const notes: string[] = []

    // 1. 构建个人信息
    const personalInfo = this.buildPersonalInfo(profile.profile)

    // 2. 生成职业目标
    const careerObjective = this.config.includeObjective
      ? this.buildCareerObjective(profile.profile, cvStrategy, jobTitle, company)
      : undefined

    // 3. 筛选和排序技能
    const skills = this.optimizeSkills(
      profile.skills || [],
      cvStrategy.skillsHighlight,
      cvStrategy.avoid
    )
    notes.push(`技能: 从 ${profile.skills?.length || 0} 个筛选出 ${skills.length} 个`)

    // 4. 优化工作经历
    const workExperience = this.optimizeWorkExperience(
      profile.work_experiences || [],
      cvStrategy
    )
    notes.push(`工作经历: 从 ${profile.work_experiences?.length || 0} 个筛选出 ${workExperience.length} 个`)

    // 5. 筛选项目
    const projects = this.optimizeProjects(
      profile.projects || [],
      cvStrategy.projectFocus,
      cvStrategy.avoid
    )
    notes.push(`项目: 从 ${profile.projects?.length || 0} 个筛选出 ${projects.length} 个`)

    // 6. 转换教育背景
    const education = this.convertEducation(
      profile.education_records || [],
      cvStrategy.emphasis['education'] || 50
    )

    // 7. 筛选证书
    const certifications = this.optimizeCertifications(
      profile.certifications || [],
      cvStrategy.avoid
    )

    return {
      personalInfo,
      careerObjective,
      skills,
      workExperience,
      projects,
      education,
      certifications,
      appliedStrategy: cvStrategy,
      optimizationNotes: notes,
    }
  }

  /**
   * 构建个人信息
   */
  private buildPersonalInfo(profile: UserProfile | null): PersonalInfo {
    if (!profile) {
      return {
        fullName: 'Unknown',
        email: '',
      }
    }

    return {
      fullName: profile.full_name,
      email: profile.email,
      phone: profile.phone,
      location: profile.location,
      linkedIn: profile.linkedin_url,
      github: profile.github_url,
      website: profile.website_url,
    }
  }

  /**
   * 生成针对性职业目标
   */
  private buildCareerObjective(
    profile: UserProfile | null,
    cvStrategy: CVStrategy,
    jobTitle: string,
    company: string
  ): string {
    // 如果有指导，使用指导
    if (cvStrategy.objectiveGuidance) {
      const keySkills = cvStrategy.skillsHighlight.slice(0, 3).join('、')

      switch (cvStrategy.tone) {
        case 'technical':
          return `专注于${keySkills}的工程师，致力于构建高质量的技术解决方案。寻求${company}的${jobTitle}职位，以应用专业技能并推动技术创新。`
        case 'executive':
          return `经验丰富的专业人士，擅长${keySkills}及团队领导。期望加入${company}担任${jobTitle}，发挥战略价值并推动业务增长。`
        case 'creative':
          return `热爱${keySkills}，追求创新与用户体验的完美结合。希望在${company}的${jobTitle}角色中发挥创意潜力。`
        case 'conversational':
          return `对${keySkills}充满热情，享受解决复杂问题的过程。期待在${company}担任${jobTitle}，与优秀团队一起创造价值。`
        default:
          return `具备${keySkills}等专业能力，寻求${company}的${jobTitle}职位，以贡献专业价值并实现职业发展。`
      }
    }

    // 使用profile中的summary（如果有）
    if (profile?.professional_summary) {
      return profile.professional_summary
    }

    // 默认生成
    return `寻求${jobTitle}职位，期望在${company}发挥专业技能并实现职业发展。`
  }

  /**
   * 优化技能列表
   */
  private optimizeSkills(
    skills: UserSkill[],
    highlight: string[],
    avoid: string[]
  ): Skill[] {
    // 过滤掉应避免的技能
    const filteredSkills = skills.filter(
      (skill) => !this.shouldAvoid(skill.name, avoid)
    )

    // 分离highlight技能和其他技能
    const highlightSet = new Set(highlight.map((h) => h.toLowerCase()))
    const highlightSkills: UserSkill[] = []
    const otherSkills: UserSkill[] = []

    filteredSkills.forEach((skill) => {
      if (highlightSet.has(skill.name.toLowerCase())) {
        highlightSkills.push(skill)
      } else {
        otherSkills.push(skill)
      }
    })

    // 添加highlight中存在但用户技能中没有的（可能是岗位要求但用户未列出）
    const existingSkillNames = new Set(
      filteredSkills.map((s) => s.name.toLowerCase())
    )
    const missingHighlights = highlight.filter(
      (h) => !existingSkillNames.has(h.toLowerCase())
    )

    // 合并：highlight技能优先 + 其他技能
    const sortedSkills: UserSkill[] = [
      ...highlightSkills,
      ...otherSkills,
      // 添加缺失的highlight（用户可能有但未列出）
      ...missingHighlights.slice(0, 3).map((name) => ({
        id: `suggested-${name}`,
        user_id: '',
        name,
        level: undefined,
        years_experience: undefined,
        category: undefined,
        display_order: 999,
        created_at: new Date().toISOString(),
      })),
    ]

    // 限制数量并转换格式
    return sortedSkills.slice(0, this.config.maxSkills).map((skill) => ({
      name: skill.name,
      // 转换skill level：profile用的是 beginner|intermediate|advanced|expert
      // resume用的是 beginner|intermediate|expert
      // advanced需要映射为intermediate
      level: skill.level === 'advanced' ? 'intermediate' : skill.level as Skill['level'],
      category: skill.category,
    }))
  }

  /**
   * 优化工作经历
   */
  private optimizeWorkExperience(
    experiences: ProfileWorkExperience[],
    cvStrategy: CVStrategy
  ): ResumeWorkExperience[] {
    // 过滤掉应避免的经历
    const filteredExps = experiences.filter(
      (exp) =>
        !this.shouldAvoid(exp.company, cvStrategy.avoid) &&
        !this.shouldAvoid(exp.position, cvStrategy.avoid)
    )

    // 按时间排序（最新的在前）
    const sortedExps = [...filteredExps].sort((a, b) => {
      const dateA = a.is_current ? new Date() : new Date(a.end_date || a.start_date)
      const dateB = b.is_current ? new Date() : new Date(b.end_date || b.start_date)
      return dateB.getTime() - dateA.getTime()
    })

    // 转换并应用framing
    return sortedExps.slice(0, this.config.maxWorkExperiences).map((exp, index) => {
      const framing = cvStrategy.experienceFraming[`work_${index}`]
      const achievements = this.optimizeAchievements(
        exp.achievements,
        framing,
        cvStrategy.actionVerbs
      )

      return {
        id: exp.id,
        company: exp.company,
        position: exp.position,
        startDate: exp.start_date,
        endDate: exp.is_current ? undefined : exp.end_date,
        isCurrent: exp.is_current,
        description: exp.description || '',
        achievements,
      }
    })
  }

  /**
   * 优化成就描述
   */
  private optimizeAchievements(
    achievements: string[],
    framing: string | undefined,
    actionVerbs: string[]
  ): string[] {
    if (!achievements || achievements.length === 0) {
      return []
    }

    // 如果有framing指导，根据关键词重排序
    if (framing) {
      const framingKeywords = framing.toLowerCase().split(/[，,、\s]+/)
      const scored = achievements.map((achievement) => {
        const lower = achievement.toLowerCase()
        const score = framingKeywords.reduce(
          (sum, keyword) => sum + (lower.includes(keyword) ? 1 : 0),
          0
        )
        return { achievement, score }
      })

      // 按相关性排序
      scored.sort((a, b) => b.score - a.score)
      return scored.slice(0, 5).map((s) => s.achievement)
    }

    // 默认：优先选择包含行动动词的成就
    if (actionVerbs.length > 0) {
      const scored = achievements.map((achievement) => {
        const hasActionVerb = actionVerbs.some((verb) =>
          achievement.includes(verb)
        )
        return { achievement, score: hasActionVerb ? 1 : 0 }
      })
      scored.sort((a, b) => b.score - a.score)
      return scored.slice(0, 5).map((s) => s.achievement)
    }

    return achievements.slice(0, 5)
  }

  /**
   * 优化项目列表
   */
  private optimizeProjects(
    projects: UserProject[],
    focus: string[],
    avoid: string[]
  ): ResumeProject[] {
    // 过滤掉应避免的项目
    const filteredProjects = projects.filter(
      (project) => !this.shouldAvoid(project.name, avoid)
    )

    // 如果有focus，优先选择匹配的项目
    const focusProjects: UserProject[] = []
    const otherProjects: UserProject[] = []

    filteredProjects.forEach((project) => {
      const nameMatch = focus.some((f) =>
        project.name.toLowerCase().includes(f.toLowerCase())
      )
      if (nameMatch) {
        focusProjects.push(project)
      } else {
        otherProjects.push(project)
      }
    })

    // 合并：focus项目优先
    const sortedProjects = [...focusProjects, ...otherProjects]

    // 转换格式
    return sortedProjects.slice(0, this.config.maxProjects).map((project) => ({
      id: project.id,
      name: project.name,
      description: project.description,
      technologies: project.technologies,
      highlights: project.highlights,
      startDate: project.start_date,
      endDate: project.end_date,
      url: project.url,
    }))
  }

  /**
   * 转换教育背景
   */
  private convertEducation(
    records: EducationRecord[],
    emphasisWeight: number
  ): ResumeEducation[] {
    // 按时间排序（最新的在前）
    const sorted = [...records].sort((a, b) => {
      const dateA = new Date(a.end_date || a.start_date)
      const dateB = new Date(b.end_date || b.start_date)
      return dateB.getTime() - dateA.getTime()
    })

    // 根据emphasis决定详细程度
    const maxCount = emphasisWeight > 70 ? 3 : emphasisWeight > 40 ? 2 : 1

    return sorted.slice(0, maxCount).map((record) => ({
      id: record.id,
      institution: record.institution,
      degree: record.degree,
      major: record.major,
      startDate: record.start_date,
      endDate: record.is_current ? undefined : record.end_date,
      gpa: record.gpa,
      achievements: emphasisWeight > 60 ? record.achievements : [],
    }))
  }

  /**
   * 优化证书列表
   */
  private optimizeCertifications(
    certifications: UserCertification[],
    avoid: string[]
  ): ResumeCertification[] {
    // 过滤掉应避免的证书
    const filtered = certifications.filter(
      (cert) =>
        !this.shouldAvoid(cert.name, avoid) &&
        !this.shouldAvoid(cert.issuer, avoid)
    )

    // 按发证日期排序（最新的在前）
    const sorted = [...filtered].sort((a, b) => {
      const dateA = new Date(a.issue_date)
      const dateB = new Date(b.issue_date)
      return dateB.getTime() - dateA.getTime()
    })

    return sorted.slice(0, this.config.maxCertifications).map((cert) => ({
      id: cert.id,
      name: cert.name,
      issuer: cert.issuer,
      issueDate: cert.issue_date,
      expiryDate: cert.expiry_date,
      credentialId: cert.credential_id,
      credentialUrl: cert.credential_url,
    }))
  }

  /**
   * 检查是否应该避免某项内容
   */
  private shouldAvoid(text: string, avoidList: string[]): boolean {
    if (!text || avoidList.length === 0) {
      return false
    }

    const lowerText = text.toLowerCase()
    return avoidList.some((avoid) => lowerText.includes(avoid.toLowerCase()))
  }
}

// =====================================================
// 工具函数
// =====================================================

/**
 * 创建优化器实例
 */
export function createOptimizer(
  config?: Partial<OptimizationConfig>
): ResumeContentOptimizer {
  return new ResumeContentOptimizer(config)
}

/**
 * 快捷优化函数
 */
export function optimizeResumeContent(
  profile: FullProfile,
  cvStrategy: CVStrategy,
  jobTitle: string,
  company: string,
  config?: Partial<OptimizationConfig>
): OptimizedResumeContent {
  const optimizer = createOptimizer(config)
  return optimizer.optimizeContent(profile, cvStrategy, jobTitle, company)
}

/**
 * 根据emphasis权重获取章节详细程度
 */
export function getSectionDetailLevel(
  emphasis: Record<string, number>,
  section: string
): 'minimal' | 'standard' | 'detailed' {
  const weight = emphasis[section] || 50

  if (weight >= 80) return 'detailed'
  if (weight >= 50) return 'standard'
  return 'minimal'
}

/**
 * 根据tone获取推荐的写作风格描述
 */
export function getToneDescription(tone: CVTone): string {
  switch (tone) {
    case 'technical':
      return '使用技术术语，关注实现细节和技术指标'
    case 'executive':
      return '强调战略视角、业务影响和领导力'
    case 'creative':
      return '展现创意思维和独特视角'
    case 'conversational':
      return '友好亲切，展现个人特质'
    case 'formal':
    default:
      return '专业正式，客观陈述事实'
  }
}
