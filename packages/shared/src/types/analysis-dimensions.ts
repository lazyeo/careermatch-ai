/**
 * 8维度分析类型定义
 *
 * Phase 3: 智能增强 - 完整的8维度岗位匹配分析系统
 *
 * 8个维度:
 * 1. role_positioning - 角色定位
 * 2. core_responsibilities - 核心职责
 * 3. keyword_matching - 关键词匹配
 * 4. key_requirements - 关键要求
 * 5. swot_analysis - SWOT分析
 * 6. cv_strategy - CV策略（核心）
 * 7. interview_preparation - 面试准备
 * 8. match_score - 匹配度评分
 */

// =====================================================
// 1. 角色定位 (Role Positioning)
// =====================================================

export interface RolePositioning {
  /** 岗位的核心定位描述 */
  summary: string
  /** 岗位级别 */
  level: 'entry' | 'junior' | 'mid' | 'senior' | 'lead' | 'principal' | 'executive'
  /** 所属领域 */
  domain: string
  /** 主要职能 */
  primaryFunction: string
  /** 汇报关系 */
  reportingLine?: string
  /** 团队规模（如果适用） */
  teamSize?: string
  /** 候选人定位匹配度 */
  candidateFit: {
    currentLevel: string
    targetLevel: string
    gap: string
    readiness: 'ready' | 'stretch' | 'gap' | 'overqualified'
  }
}

// =====================================================
// 2. 核心职责 (Core Responsibilities)
// =====================================================

export interface CoreResponsibility {
  /** 职责描述 */
  description: string
  /** 重要程度 */
  importance: 'critical' | 'important' | 'nice_to_have'
  /** 候选人相关经验 */
  candidateEvidence?: string
  /** 匹配状态 */
  matchStatus: 'strong' | 'partial' | 'weak' | 'none'
}

export interface CoreResponsibilities {
  /** 核心职责列表 */
  responsibilities: CoreResponsibility[]
  /** 职责覆盖率 (0-100) */
  coverageScore: number
  /** 总结 */
  summary: string
}

// =====================================================
// 3. 关键词匹配 (Keyword Matching)
// =====================================================

export interface KeywordItem {
  /** 关键词 */
  keyword: string
  /** 类别 */
  category: 'technical' | 'soft_skill' | 'domain' | 'tool' | 'certification' | 'other'
  /** 重要性 */
  importance: 'required' | 'preferred' | 'bonus'
  /** 是否在简历中找到 */
  found: boolean
  /** 在简历中的上下文（如果找到） */
  context?: string
  /** 同义词/相关词 */
  relatedTerms?: string[]
}

export interface KeywordMatching {
  /** 所有关键词 */
  keywords: KeywordItem[]
  /** 必需关键词匹配率 (0-100) */
  requiredMatchRate: number
  /** 整体匹配率 (0-100) */
  overallMatchRate: number
  /** ATS友好度评估 */
  atsFriendliness: 'excellent' | 'good' | 'fair' | 'poor'
  /** 建议添加的关键词 */
  suggestedAdditions: string[]
}

// =====================================================
// 4. 关键要求 (Key Requirements)
// =====================================================

export interface Requirement {
  /** 要求描述 */
  description: string
  /** 类型 */
  type: 'experience' | 'education' | 'skill' | 'certification' | 'language' | 'location' | 'other'
  /** 是否必需 */
  mandatory: boolean
  /** 候选人是否满足 */
  met: boolean
  /** 候选人证据 */
  evidence?: string
  /** 差距说明（如果不满足） */
  gap?: string
}

export interface KeyRequirements {
  /** 所有要求 */
  requirements: Requirement[]
  /** 必需要求满足率 (0-100) */
  mandatoryFulfillmentRate: number
  /** 整体满足率 (0-100) */
  overallFulfillmentRate: number
  /** 主要差距 */
  majorGaps: string[]
  /** 主要优势 */
  majorStrengths: string[]
}

// =====================================================
// 5. SWOT分析 (SWOT Analysis)
// =====================================================

export interface EnhancedSWOTAnalysis {
  /** 优势 - 候选人相对于岗位的强项 */
  strengths: Array<{
    point: string
    evidence: string
    impact: 'high' | 'medium' | 'low'
  }>
  /** 劣势 - 候选人需要改进的地方 */
  weaknesses: Array<{
    point: string
    suggestion: string
    severity: 'critical' | 'moderate' | 'minor'
  }>
  /** 机会 - 这个岗位能带来的发展机会 */
  opportunities: Array<{
    point: string
    timeframe: 'short_term' | 'medium_term' | 'long_term'
  }>
  /** 威胁 - 潜在的挑战和风险 */
  threats: Array<{
    point: string
    mitigation?: string
    likelihood: 'high' | 'medium' | 'low'
  }>
  /** 综合建议 */
  overallAssessment: string
}

// =====================================================
// 6. CV策略 (CV Strategy) - 核心！
// =====================================================

export interface CVStrategy {
  /** 章节推荐顺序 */
  priorityOrder: ResumeSectionPriority[]
  /**
   * 章节强调权重 (0-100)
   * 高权重的章节应该更详细、更突出
   */
  emphasis: Record<string, number>
  /**
   * 应突出的项目名称
   * 从候选人的项目中选择最相关的
   */
  projectFocus: string[]
  /**
   * 应强调的技能
   * 应与岗位要求高度匹配
   */
  skillsHighlight: string[]
  /**
   * 经历描述指导
   * key: work_0, work_1, project_0, etc.
   * value: 如何描述/强调该经历
   */
  experienceFraming: Record<string, string>
  /**
   * 应淡化或省略的内容
   * 不相关或可能产生负面影响的内容
   */
  avoid: string[]
  /**
   * 推荐的语气
   */
  tone: CVTone
  /**
   * 职业目标撰写指导
   */
  objectiveGuidance: string
  /**
   * 量化建议
   * 建议添加或强调的数字/指标
   */
  quantificationSuggestions: string[]
  /**
   * 行动动词推荐
   * 适合该岗位风格的动词
   */
  actionVerbs: string[]
}

export type CVTone = 'formal' | 'conversational' | 'technical' | 'creative' | 'executive'

export type ResumeSectionPriority =
  | 'header'
  | 'summary'
  | 'skills'
  | 'experience'
  | 'projects'
  | 'education'
  | 'certifications'
  | 'awards'
  | 'publications'
  | 'languages'
  | 'volunteer'

// =====================================================
// 7. 面试准备 (Interview Preparation)
// =====================================================

export interface InterviewQuestion {
  /** 问题 */
  question: string
  /** 问题类型 */
  type: 'behavioral' | 'technical' | 'situational' | 'competency' | 'motivation'
  /** 难度 */
  difficulty: 'basic' | 'intermediate' | 'advanced'
  /** 建议的回答要点 */
  answerPoints: string[]
  /** 相关的候选人经历（可用于回答） */
  relevantExperience?: string
}

export interface InterviewPreparation {
  /** 预计的面试问题 */
  likelyQuestions: InterviewQuestion[]
  /** 候选人应该问面试官的问题 */
  questionsToAsk: string[]
  /** 需要复习的技术点 */
  technicalReview: string[]
  /** 需要准备的项目故事 */
  projectStories: Array<{
    project: string
    angle: string
    starFormat: {
      situation: string
      task: string
      action: string
      result: string
    }
  }>
  /** 面试注意事项 */
  tips: string[]
}

// =====================================================
// 8. 匹配度评分 (Match Score)
// =====================================================

export interface MatchScoreBreakdown {
  /** 技能匹配分 */
  skillsScore: number
  /** 经验匹配分 */
  experienceScore: number
  /** 教育匹配分 */
  educationScore: number
  /** 文化契合度 */
  cultureFitScore: number
  /** 职业发展匹配 */
  careerFitScore: number
}

export interface MatchScore {
  /** 总分 (0-100) */
  overall: number
  /** 细分得分 */
  breakdown: MatchScoreBreakdown
  /** 置信度 */
  confidence: 'high' | 'medium' | 'low'
  /** 推荐等级 */
  recommendation: MatchRecommendation
  /** 一句话总结 */
  summary: string
}

export type MatchRecommendation =
  | 'strong_match'
  | 'good_match'
  | 'moderate_match'
  | 'weak_match'
  | 'not_recommended'

// =====================================================
// 完整的8维度分析结构
// =====================================================

export interface AnalysisDimensions {
  /** 1. 角色定位 */
  rolePositioning: RolePositioning
  /** 2. 核心职责 */
  coreResponsibilities: CoreResponsibilities
  /** 3. 关键词匹配 */
  keywordMatching: KeywordMatching
  /** 4. 关键要求 */
  keyRequirements: KeyRequirements
  /** 5. SWOT分析 */
  swotAnalysis: EnhancedSWOTAnalysis
  /** 6. CV策略（核心） */
  cvStrategy: CVStrategy
  /** 7. 面试准备 */
  interviewPreparation: InterviewPreparation
  /** 8. 匹配度评分 */
  matchScore: MatchScore
}

// =====================================================
// 数据库存储类型
// =====================================================

export interface DatabaseAnalysisDimensions {
  role_positioning: RolePositioning
  core_responsibilities: CoreResponsibilities
  keyword_matching: KeywordMatching
  key_requirements: KeyRequirements
  swot_analysis: EnhancedSWOTAnalysis
  cv_strategy: CVStrategy
  interview_preparation: InterviewPreparation
  match_score: MatchScore
}

// =====================================================
// 转换函数类型
// =====================================================

export interface DimensionsTransformer {
  toDatabase(dimensions: AnalysisDimensions): DatabaseAnalysisDimensions
  fromDatabase(dbDimensions: DatabaseAnalysisDimensions): AnalysisDimensions
}

// =====================================================
// 部分维度类型（用于渐进式解析）
// =====================================================

export type PartialAnalysisDimensions = Partial<AnalysisDimensions>

// =====================================================
// 简化的CV策略（用于简历生成）
// =====================================================

export interface SimplifiedCVStrategy {
  /** 章节顺序 */
  sectionOrder: ResumeSectionPriority[]
  /** 要突出的技能 */
  highlightSkills: string[]
  /** 要突出的项目 */
  highlightProjects: string[]
  /** 语气 */
  tone: CVTone
  /** 要避免的内容 */
  avoid: string[]
}

/**
 * 从完整CV策略中提取简化版本
 */
export function simplifyStrategy(strategy: CVStrategy): SimplifiedCVStrategy {
  return {
    sectionOrder: strategy.priorityOrder,
    highlightSkills: strategy.skillsHighlight,
    highlightProjects: strategy.projectFocus,
    tone: strategy.tone,
    avoid: strategy.avoid,
  }
}
