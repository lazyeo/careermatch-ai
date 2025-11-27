// Resume types
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

// Job types
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

// User types
export type {
  User,
  UserProfile,
  JobPreferences,
  WorkHistorySummary,
  EducationSummary,
} from './user'
