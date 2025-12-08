/**
 * Resume Quality Validation Type Definitions
 * 简历质量验证类型定义
 */

import type { ResumeContent } from './resume'
import type { UserProfile } from './profile'

/**
 * 幻觉检测结果
 * 检测AI可能编造的内容
 */
export interface Hallucination {
  field: string              // 字段路径，如 'workExperience[0].achievements[2]'
  type: HallucinationType    // 幻觉类型
  severity: 'low' | 'medium' | 'high'  // 严重程度
  description: string        // 描述
  suggestedFix?: string     // 建议修复
}

/**
 * 幻觉类型
 */
export type HallucinationType =
  | 'fabricated_achievement'   // 编造的成就
  | 'exaggerated_metric'      // 夸大的数据
  | 'invented_skill'          // 虚构的技能
  | 'fake_project'            // 虚假项目
  | 'false_certification'     // 虚假证书
  | 'modified_date'           // 修改的日期
  | 'added_responsibility'    // 添加的职责
  | 'other'                   // 其他

/**
 * 验证标记
 */
export interface ValidationFlag {
  level: 'error' | 'warning' | 'info'  // 级别
  category: ValidationCategory         // 分类
  field: string                        // 相关字段
  message: string                      // 消息
  details?: Record<string, unknown>    // 详细信息
}

/**
 * 验证分类
 */
export type ValidationCategory =
  | 'accuracy'        // 准确性问题
  | 'completeness'    // 完整性问题
  | 'consistency'     // 一致性问题
  | 'relevance'       // 相关性问题
  | 'formatting'      // 格式问题

/**
 * 数据来源映射
 * 追踪简历每个字段对应的Profile表记录
 */
export interface SourceMapping {
  personal_info: {
    table: 'user_profiles'
    id: string
  }
  work_experience: Array<{
    index: number
    table: 'work_experiences'
    id: string
    field_mapping: Record<string, string>  // resume field -> db column
  }>
  education: Array<{
    index: number
    table: 'education_records'
    id: string
    field_mapping: Record<string, string>
  }>
  skills: Array<{
    index: number
    table: 'user_skills'
    id: string
  }>
  projects: Array<{
    index: number
    table: 'user_projects'
    id: string
    field_mapping: Record<string, string>
  }>
  certifications: Array<{
    index: number
    table: 'user_certifications'
    id: string
  }>
}

/**
 * 字段验证结果
 */
export interface FieldValidation {
  field: string
  isValid: boolean
  accuracy: number          // 0-100
  issues: ValidationFlag[]
}

/**
 * 质量报告
 */
export interface QualityReport {
  // 综合评分
  qualityScore: number           // 0-100
  accuracy: number               // 事实准确性 (0-100)
  completeness: number           // 信息完整度 (0-100)
  relevance: number              // 与岗位相关性 (0-100)

  // 检测结果
  hallucinations: Hallucination[]     // 幻觉检测
  flags: ValidationFlag[]             // 验证标记

  // 数据追踪
  sourceMapping: SourceMapping        // 数据来源映射

  // 字段级验证
  fieldValidations: FieldValidation[] // 每个字段的验证结果

  // 统计信息
  stats: {
    totalFields: number              // 总字段数
    validatedFields: number          // 已验证字段数
    errorCount: number               // 错误数
    warningCount: number             // 警告数
    hallucinationCount: number       // 幻觉检测数
  }

  // 建议
  suggestions: string[]              // 改进建议

  // 元数据
  validatedAt: Date
  validator: string                  // 验证器版本
}

/**
 * 验证选项
 */
export interface ValidationOptions {
  // 检查级别
  checkHallucinations: boolean       // 是否检测幻觉
  checkCompleteness: boolean         // 是否检查完整性
  checkRelevance: boolean            // 是否检查相关性
  strictMode: boolean                // 严格模式

  // 阈值配置
  minQualityScore: number           // 最低质量分数 (0-100)
  maxHallucinationCount: number     // 最大幻觉数量

  // 跳过字段
  skipFields?: string[]             // 跳过验证的字段
}

/**
 * 字段比较结果
 */
export interface FieldComparisonResult {
  field: string
  sourceValue: unknown
  generatedValue: unknown
  isMatch: boolean
  similarity: number      // 0-1，相似度
  issues: string[]
}

/**
 * 工作经历验证结果
 */
export interface WorkExperienceValidation {
  index: number
  company: FieldComparisonResult
  position: FieldComparisonResult
  startDate: FieldComparisonResult
  endDate: FieldComparisonResult
  achievements: {
    totalSource: number
    totalGenerated: number
    fabricatedCount: number
    modifiedCount: number
    validCount: number
  }
}

/**
 * 教育背景验证结果
 */
export interface EducationValidation {
  index: number
  institution: FieldComparisonResult
  degree: FieldComparisonResult
  major: FieldComparisonResult
  graduationDate: FieldComparisonResult
  gpa?: FieldComparisonResult
}

/**
 * 技能验证结果
 */
export interface SkillValidation {
  totalSource: number
  totalGenerated: number
  matchedCount: number
  addedCount: number        // AI添加的技能数
  addedSkills: string[]     // AI添加的技能列表
}

/**
 * 详细验证结果
 * 包含每个章节的详细验证
 */
export interface DetailedValidationResult {
  workExperience: WorkExperienceValidation[]
  education: EducationValidation[]
  skills: SkillValidation
  overall: QualityReport
}

/**
 * 质量修正建议
 */
export interface QualityCorrection {
  field: string
  currentValue: unknown
  suggestedValue: unknown
  reason: string
  confidence: number        // 0-1，建议的置信度
}

/**
 * 修正结果
 */
export interface CorrectionResult {
  applied: boolean
  corrections: QualityCorrection[]
  updatedContent: ResumeContent
  newQualityScore: number
}

/**
 * 验证上下文
 * 传递给验证器的完整上下文
 */
export interface ValidationContext {
  resumeContent: ResumeContent
  profile: UserProfile
  jobDescription?: string   // 可选：岗位描述，用于相关性检查
  options: ValidationOptions
}

/**
 * 数据库存储的验证结果
 */
export interface DatabaseValidationResult {
  quality_score: number
  validation_flags: ValidationFlag[]
  source_mapping: SourceMapping
}

/**
 * 数据库存储的质量指标
 */
export interface DatabaseQualityMetrics {
  accuracy: number
  completeness: number
  relevance: number
  hallucination_count: number
  error_count: number
  warning_count: number
  validated_at: string
  validator_version: string
}
