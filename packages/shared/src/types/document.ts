// =====================================================
// Document Types (文档相关类型)
// =====================================================

/**
 * 文档类型
 */
export type DocumentType = 'resume' | 'cover_letter' | 'other'

/**
 * 统一文档
 */
export interface Document {
  id: string
  user_id: string
  doc_type: DocumentType
  title: string
  target_job_id?: string
  content_markdown: string
  version: number
  parent_version_id?: string
  is_latest: boolean
  generation_prompt?: string
  ai_provider?: string
  ai_model?: string
  template_id?: string
  style_config?: DocumentStyleConfig
  created_at: string
  updated_at: string
}

/**
 * 文档样式配置
 */
export interface DocumentStyleConfig {
  font_family?: string
  font_size?: string
  line_height?: number
  margin?: string
  theme?: 'light' | 'dark' | 'professional' | 'creative'
  accent_color?: string
  custom_css?: string
}

/**
 * 文档版本摘要
 */
export interface DocumentVersionSummary {
  id: string
  version: number
  title: string
  created_at: string
  is_latest: boolean
}

/**
 * 文档对比结果
 */
export interface DocumentComparison {
  id: string
  user_id: string
  doc_a_id: string
  doc_b_id: string
  comparison_result: DocumentComparisonResult
  ai_provider?: string
  ai_model?: string
  created_at: string
}

/**
 * AI生成的对比分析结果
 */
export interface DocumentComparisonResult {
  summary: string
  additions: string[]
  removals: string[]
  modifications: Array<{
    before: string
    after: string
  }>
  recommendations: string[]
}

// =====================================================
// API Request/Response Types
// =====================================================

/**
 * 生成文档的请求
 */
export interface GenerateDocumentRequest {
  doc_type: DocumentType
  target_job_id?: string
  title?: string
  custom_prompt?: string
  template_id?: string
  style_config?: DocumentStyleConfig
}

/**
 * 更新文档的请求（会创建新版本）
 */
export interface UpdateDocumentRequest {
  title?: string
  content_markdown: string
  create_new_version?: boolean  // 默认true
}

/**
 * 文档列表筛选参数
 */
export interface DocumentListParams {
  doc_type?: DocumentType
  target_job_id?: string
  is_latest?: boolean
  page?: number
  limit?: number
}

/**
 * 文档对比请求
 */
export interface CompareDocumentsRequest {
  doc_a_id: string
  doc_b_id: string
}

/**
 * 导出PDF请求
 */
export interface ExportPdfRequest {
  document_id: string
  template_id?: string
  style_config?: DocumentStyleConfig
  filename?: string
}

// =====================================================
// Job Import Types (岗位导入相关类型)
// =====================================================

/**
 * 岗位导入方式
 */
export type JobImportType = 'url' | 'screenshot' | 'paste'

/**
 * 岗位导入状态
 */
export type JobImportStatus = 'pending' | 'processing' | 'completed' | 'failed'

/**
 * 岗位导入记录
 */
export interface JobImport {
  id: string
  user_id: string
  job_id?: string
  import_type: JobImportType
  source_url?: string
  source_content?: string
  screenshot_path?: string
  status: JobImportStatus
  parsed_data?: DocumentParsedJobData
  error_message?: string
  ai_provider?: string
  ai_model?: string
  created_at: string
  processed_at?: string
}

/**
 * 新版岗位状态
 */
export type JobV2Status = 'saved' | 'applied' | 'interviewing' | 'offered' | 'rejected' | 'withdrawn'

/**
 * 新版岗位（灵活结构）
 */
export interface JobV2 {
  id: string
  user_id: string
  title: string
  company: string
  location?: string
  salary_range?: string
  job_type?: string
  remote_policy?: string
  source_url?: string
  source_platform?: string
  description?: string
  parsed_content: ParsedJobContent
  status: JobV2Status
  import_method?: JobImportType | 'manual'
  ai_provider?: string
  ai_model?: string
  created_at: string
  updated_at: string
}

/**
 * AI解析的岗位结构化内容
 */
export interface ParsedJobContent {
  responsibilities?: string[]
  requirements?: string[]
  qualifications?: string[]
  benefits?: string[]
  skills_required?: string[]
  experience_level?: string
  education_required?: string
  company_info?: string
  application_deadline?: string
  custom_fields?: Array<{
    key: string
    value: string
  }>
}

/**
 * AI解析的岗位数据（用于导入预览）
 */
export interface DocumentParsedJobData {
  title: string
  company: string
  location?: string
  salary_range?: string
  job_type?: string
  remote_policy?: string
  description?: string
  parsed_content: ParsedJobContent
}

// =====================================================
// API Request/Response Types
// =====================================================

/**
 * 导入岗位请求
 */
export interface ImportJobRequest {
  import_type: JobImportType
  source_url?: string      // URL导入
  source_content?: string  // 粘贴导入
  screenshot_file?: File   // 截图导入（前端处理）
}

/**
 * 确认导入岗位请求
 */
export interface ConfirmJobImportRequest {
  import_id: string
  data_overrides?: Partial<DocumentParsedJobData>
}

/**
 * 创建岗位请求（手动）
 */
export interface CreateJobV2Request {
  title: string
  company: string
  location?: string
  salary_range?: string
  job_type?: string
  remote_policy?: string
  source_url?: string
  source_platform?: string
  description?: string
  parsed_content?: ParsedJobContent
}

/**
 * 更新岗位请求
 */
export interface UpdateJobV2Request extends Partial<CreateJobV2Request> {
  status?: JobV2Status
}

/**
 * 岗位列表筛选参数
 */
export interface JobV2ListParams {
  status?: JobV2Status
  search?: string
  source_platform?: string
  page?: number
  limit?: number
}
