// Resume types (Legacy - v1)
export type {
  Resume,
  ResumeContent,
  PersonalInfo,
  Skill,
  WorkExperience,
  Project,
  Education,
  Certification,
} from './resume'

// Job types (includes v1 and analysis types)
export type {
  Job,
  JobType,
  JobStatus,
  SalaryRange,
  JobAnalysis,
  AnalysisDimension,
  SWOTAnalysis,
  KeywordMatch,
  // 新版AI分析系统类型
  AnalysisSessionStatus,
  AnalysisRecommendation,
  AnalysisSession,
  AnalysisMessage,
  AnalyzeResponse,
  ChatResponse,
  AIAnalysisOutput,
  ParsedJobData,
} from './job'

// Application types
export type {
  Application,
  ApplicationStatus,
  TimelineEvent,
  TimelineEventType,
  Interview,
  InterviewType,
  InterviewStatus,
  Attachment,
} from './application'

// User types (Legacy)
export type {
  User,
  UserProfile as LegacyUserProfile,
  JobPreferences,
  WorkHistorySummary,
  EducationSummary,
} from './user'

// =====================================================
// Profile-Centric Types (新版个人资料中心化类型)
// =====================================================
export type {
  // 核心实体
  UserProfile,
  WorkExperience as ProfileWorkExperience,
  EducationRecord,
  UserSkill,
  UserProject,
  UserCertification,
  ResumeUpload,
  // 类型枚举
  SkillLevel,
  ResumeUploadStatus,
  ResumeFileType,
  // 复合类型
  ParsedResumeData,
  FullProfile,
  ProfileCompleteness,
  // API请求类型
  UpdateProfileRequest,
  WorkExperienceInput,
  EducationRecordInput,
  UserSkillInput,
  UserProjectInput,
  UserCertificationInput,
  ApplyParsedDataRequest,
} from './profile'

// =====================================================
// Document Types (文档相关类型)
// =====================================================
export type {
  // 文档实体
  Document,
  DocumentType,
  DocumentStyleConfig,
  DocumentVersionSummary,
  DocumentComparison,
  DocumentComparisonResult,
  // 岗位导入
  JobImport,
  JobImportType,
  JobImportStatus,
  JobV2,
  JobV2Status,
  ParsedJobContent,
  DocumentParsedJobData,
  // API请求类型
  GenerateDocumentRequest,
  UpdateDocumentRequest,
  DocumentListParams,
  CompareDocumentsRequest,
  ExportPdfRequest,
  ImportJobRequest,
  ConfirmJobImportRequest,
  CreateJobV2Request,
  UpdateJobV2Request,
  JobV2ListParams,
} from './document'

// =====================================================
// Template Types (模板系统类型 - Phase 1)
// =====================================================
export type {
  // 模板配置
  TemplateColors,
  TemplateFonts,
  TemplateSpacing,
  TemplateConfig,
  // 模板实体
  ResumeTemplate,
  UserCustomTemplate,
  TemplateCategory,
  TemplateLayout,
  ResumeSectionType,
  // 渲染相关
  OutputFormat,
  RenderOptions,
  // 数据库类型
  DatabaseResumeTemplate,
  DatabaseUserCustomTemplate,
  // 转换器
  TemplateTransformer,
  UserTemplateTransformer,
} from './template'

// =====================================================
// Resume Quality Types (简历质量验证类型 - Phase 1)
// =====================================================
export type {
  // 幻觉检测
  Hallucination,
  HallucinationType,
  // 验证结果
  ValidationFlag,
  ValidationCategory,
  QualityReport,
  DetailedValidationResult,
  // 字段验证
  FieldValidation,
  FieldComparisonResult,
  WorkExperienceValidation,
  EducationValidation,
  SkillValidation,
  // 数据来源映射
  SourceMapping,
  // 质量修正
  QualityCorrection,
  CorrectionResult,
  // 验证配置
  ValidationOptions,
  ValidationContext,
  // 数据库类型
  DatabaseValidationResult,
  DatabaseQualityMetrics,
} from './resume-quality'
