// =====================================================
// Profile-Centric Types (个人资料中心化类型)
// =====================================================

/**
 * 用户个人资料 - 基本信息
 */
export interface UserProfile {
  id: string
  user_id: string
  full_name: string
  email: string
  phone?: string
  location?: string
  linkedin_url?: string
  github_url?: string
  website_url?: string
  avatar_url?: string
  professional_summary?: string
  target_roles: string[]
  extended_data: Record<string, unknown>
  created_at: string
  updated_at: string
}

/**
 * 工作经历
 */
export interface WorkExperience {
  id: string
  user_id: string
  company: string
  position: string
  location?: string
  start_date: string  // YYYY-MM-DD
  end_date?: string   // YYYY-MM-DD
  is_current: boolean
  description?: string
  achievements: string[]
  technologies: string[]
  display_order: number
  created_at: string
  updated_at: string
}

/**
 * 教育背景
 */
export interface EducationRecord {
  id: string
  user_id: string
  institution: string
  degree: string
  major: string
  location?: string
  start_date: string  // YYYY-MM-DD
  end_date?: string   // YYYY-MM-DD
  is_current: boolean
  gpa?: number
  achievements: string[]
  display_order: number
  created_at: string
  updated_at: string
}

/**
 * 技能等级
 */
export type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert'

/**
 * 用户技能
 */
export interface UserSkill {
  id: string
  user_id: string
  name: string
  level?: SkillLevel
  years_experience?: number
  category?: string
  display_order: number
  created_at: string
}

/**
 * 用户项目
 */
export interface UserProject {
  id: string
  user_id: string
  name: string
  description: string
  role?: string
  start_date?: string  // YYYY-MM-DD
  end_date?: string    // YYYY-MM-DD
  technologies: string[]
  highlights: string[]
  url?: string
  github_url?: string
  display_order: number
  created_at: string
  updated_at: string
}

/**
 * 用户证书
 */
export interface UserCertification {
  id: string
  user_id: string
  name: string
  issuer: string
  issue_date: string  // YYYY-MM-DD
  expiry_date?: string // YYYY-MM-DD
  credential_id?: string
  credential_url?: string
  display_order: number
  created_at: string
}

/**
 * 简历上传状态
 */
export type ResumeUploadStatus = 'pending' | 'processing' | 'completed' | 'failed'

/**
 * 简历上传文件类型
 */
export type ResumeFileType = 'pdf' | 'docx' | 'doc' | 'txt'

/**
 * 简历上传记录
 */
export interface ResumeUpload {
  id: string
  user_id: string
  file_name: string
  file_type: ResumeFileType
  file_size?: number
  storage_path: string
  status: ResumeUploadStatus
  parsed_data?: ParsedResumeData
  error_message?: string
  ai_provider?: string
  ai_model?: string
  created_at: string
  processed_at?: string
}

/**
 * AI解析的简历数据
 */
export interface ParsedResumeData {
  personal_info: {
    full_name?: string
    email?: string
    phone?: string
    location?: string
    linkedin_url?: string
    github_url?: string
    website_url?: string
    professional_summary?: string
  }
  work_experiences: Array<{
    company: string
    position: string
    location?: string
    start_date: string
    end_date?: string
    is_current: boolean
    description?: string
    achievements: string[]
    technologies: string[]
  }>
  education: Array<{
    institution: string
    degree: string
    major: string
    location?: string
    start_date: string
    end_date?: string
    is_current: boolean
    gpa?: number
    achievements: string[]
  }>
  skills: Array<{
    name: string
    level?: SkillLevel
    category?: string
  }>
  projects: Array<{
    name: string
    description: string
    role?: string
    start_date?: string
    end_date?: string
    technologies: string[]
    highlights: string[]
    url?: string
    github_url?: string
  }>
  certifications: Array<{
    name: string
    issuer: string
    issue_date: string
    expiry_date?: string
    credential_id?: string
    credential_url?: string
  }>
}

/**
 * 完整用户资料（含所有子资源）
 */
export interface FullProfile {
  profile: UserProfile | null
  work_experiences: WorkExperience[] | null
  education_records: EducationRecord[] | null
  skills: UserSkill[] | null
  projects: UserProject[] | null
  certifications: UserCertification[] | null
}

/**
 * Profile完成度
 */
export interface ProfileCompleteness {
  score: number
  max_score: number
  percentage: number
  sections: {
    profile: boolean
    summary: boolean
    work: boolean
    education: boolean
    skills: boolean
    projects: boolean
  }
}

// =====================================================
// API Request/Response Types
// =====================================================

/**
 * 更新Profile基本信息的请求
 */
export interface UpdateProfileRequest {
  full_name?: string
  email?: string
  phone?: string
  location?: string
  linkedin_url?: string
  github_url?: string
  website_url?: string
  professional_summary?: string
  target_roles?: string[]
  extended_data?: Record<string, unknown>
}

/**
 * 创建/更新工作经历的请求
 */
export interface WorkExperienceInput {
  company: string
  position: string
  location?: string
  start_date: string
  end_date?: string
  is_current?: boolean
  description?: string
  achievements?: string[]
  technologies?: string[]
  display_order?: number
}

/**
 * 创建/更新教育背景的请求
 */
export interface EducationRecordInput {
  institution: string
  degree: string
  major: string
  location?: string
  start_date: string
  end_date?: string
  is_current?: boolean
  gpa?: number
  achievements?: string[]
  display_order?: number
}

/**
 * 创建/更新技能的请求
 */
export interface UserSkillInput {
  name: string
  level?: SkillLevel
  years_experience?: number
  category?: string
  display_order?: number
}

/**
 * 创建/更新项目的请求
 */
export interface UserProjectInput {
  name: string
  description: string
  role?: string
  start_date?: string
  end_date?: string
  technologies?: string[]
  highlights?: string[]
  url?: string
  github_url?: string
  display_order?: number
}

/**
 * 创建/更新证书的请求
 */
export interface UserCertificationInput {
  name: string
  issuer: string
  issue_date: string
  expiry_date?: string
  credential_id?: string
  credential_url?: string
  display_order?: number
}

/**
 * 应用解析结果到Profile的请求
 */
export interface ApplyParsedDataRequest {
  upload_id: string
  sections_to_apply: {
    personal_info: boolean
    work_experiences: boolean
    education: boolean
    skills: boolean
    projects: boolean
    certifications: boolean
  }
  merge_strategy: 'replace' | 'merge'
}
