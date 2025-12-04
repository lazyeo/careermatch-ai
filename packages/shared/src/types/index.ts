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
