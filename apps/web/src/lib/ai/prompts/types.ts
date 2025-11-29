/**
 * AI Prompt 统一管理系统 - 类型定义
 *
 * 提供类型安全的 Prompt 模板系统
 */

// ============================================
// Prompt 模板类型
// ============================================

/**
 * Prompt 变量定义
 */
export interface PromptVariable {
  name: string
  description: string
  required: boolean
  type: 'string' | 'json' | 'array' | 'number' | 'boolean'
  defaultValue?: unknown
}

/**
 * Prompt 模板
 */
export interface PromptTemplate {
  /** 唯一标识符 */
  id: string
  /** 显示名称 */
  name: string
  /** 描述 */
  description: string
  /** 版本号 */
  version: string

  /** System Prompt */
  systemPrompt: string
  /** User Prompt 模板，使用 {{variable}} 语法 */
  userPromptTemplate: string

  /** AI 配置 */
  temperature: number
  maxTokens: number

  /** 输出格式 */
  outputFormat: 'json' | 'markdown' | 'delimiter' | 'text'

  /** 变量定义 */
  variables: PromptVariable[]

  /** 可选的条件部分 */
  optionalSections?: Record<string, string>
}

// ============================================
// 上下文类型
// ============================================

/**
 * 页面类型
 */
export type PageType =
  | 'dashboard'
  | 'jobs'
  | 'job-detail'
  | 'job-analysis'
  | 'job-cover-letter'
  | 'job-import'
  | 'resumes'
  | 'resume-detail'
  | 'resume-edit'
  | 'profile'
  | 'profile-edit'
  | 'profile-upload'
  | 'applications'
  | 'other'

/**
 * 页面上下文
 */
export interface PageContext {
  path: string
  type: PageType
  params?: Record<string, string>
}

/**
 * 用户上下文
 */
export interface UserContext {
  id: string
  email?: string
  name?: string
}

/**
 * Profile 上下文
 */
export interface ProfileContext {
  id: string
  fullName: string
  email?: string
  phone?: string
  location?: string
  professionalSummary?: string
  hasWorkExperience: boolean
  hasEducation: boolean
  hasSkills: boolean
}

/**
 * 岗位上下文
 */
export interface JobContext {
  id: string
  title: string
  company: string
  location?: string
  jobType?: string
  description?: string
  requirements?: string
  salaryMin?: number
  salaryMax?: number
  salaryCurrency?: string
}

/**
 * 简历上下文
 */
export interface ResumeContext {
  id: string
  title: string
  hasContent: boolean
  lastUpdated?: string
}

/**
 * 分析会话上下文
 */
export interface SessionContext {
  id: string
  score?: number
  recommendation?: string
  hasAnalysis: boolean
}

/**
 * 完整的 Prompt 上下文
 */
export interface PromptContext {
  currentPage: PageContext
  user?: UserContext
  profile?: ProfileContext
  activeJob?: JobContext
  activeResume?: ResumeContext
  activeSession?: SessionContext
}

// ============================================
// AI 提供商类型
// ============================================

/**
 * AI 提供商类型
 */
export type AIProviderType = 'openai' | 'claude' | 'gemini' | 'codex'

/**
 * AI 提供商配置
 */
export interface AIProviderConfig {
  type: AIProviderType
  name: string
  displayName: string
  icon: string
  apiKey?: string
  baseURL?: string
  models: {
    best: string
    balanced: string
    fast: string
  }
  isConfigured: boolean
}

// ============================================
// Agent 类型
// ============================================

/**
 * 用户意图类型
 */
export type IntentType =
  | 'job_analysis' // 岗位匹配分析
  | 'resume_optimize' // 简历优化
  | 'cover_letter' // 求职信生成
  | 'job_import' // 导入岗位
  | 'resume_import' // 解析简历
  | 'interview_prep' // 面试准备
  | 'general_question' // 通用问答
  | 'action_request' // 请求执行操作
  | 'clarification' // 需要澄清

/**
 * 分类后的意图
 */
export interface ClassifiedIntent {
  type: IntentType
  confidence: number
  entities?: Record<string, string>
  suggestedAction?: string
}

/**
 * Agent 操作类型
 */
export interface AgentAction {
  /** 操作类型 */
  type: 'navigate' | 'execute' | 'show_modal' | 'confirm'
  /** 目标（URL 或 API 端点） */
  target: string
  /** 显示标签 */
  label: string
  /** 图标名称 */
  icon?: string
  /** 操作参数 */
  params?: Record<string, unknown>
  /** 是否需要确认 */
  requiresConfirmation?: boolean
}

/**
 * Agent 响应
 */
export interface AgentResponse {
  /** 响应内容（Markdown） */
  content: string
  /** 建议的操作按钮 */
  actions?: AgentAction[]
  /** 后续问题建议 */
  suggestions?: string[]
  /** 元数据 */
  metadata?: {
    intent?: IntentType
    processingTime?: number
    model?: string
    [key: string]: unknown
  }
}

// ============================================
// 会话类型
// ============================================

/**
 * 消息角色
 */
export type MessageRole = 'user' | 'assistant' | 'system'

/**
 * 分析卡片数据（用于在对话中显示分析结果）
 */
export interface AnalysisCardMetadata {
  status: 'loading' | 'completed' | 'failed'
  jobId: string
  jobTitle?: string
  company?: string
  score?: number
  recommendation?: 'strong' | 'moderate' | 'weak' | 'not_recommended'
  summary?: string
  error?: string
  sessionId?: string
}

/**
 * 对话消息
 */
export interface AssistantMessage {
  id: string
  sessionId: string
  role: MessageRole
  content: string
  metadata?: {
    intent?: IntentType
    actions?: AgentAction[]
    suggestions?: string[]
    relatedJobId?: string
    relatedResumeId?: string
    /** 分析卡片数据 */
    analysisCard?: AnalysisCardMetadata
  }
  createdAt: string
}

/**
 * 助手会话
 */
export interface AssistantSession {
  id: string
  userId: string
  title?: string
  status: 'active' | 'archived'
  initialContext?: Partial<PromptContext>
  currentContext?: Partial<PromptContext>
  messages: AssistantMessage[]
  createdAt: string
  updatedAt: string
  lastMessageAt?: string
}

// ============================================
// 温度预设
// ============================================

/**
 * 温度预设常量
 */
export const TEMPERATURE_PRESETS = {
  /** 分析任务（一致性优先） */
  ANALYTICAL: 0.1,
  /** 解析任务（准确性优先） */
  PARSING: 0.1,
  /** 平衡任务（默认） */
  BALANCED: 0.7,
  /** 创意任务（求职信等） */
  CREATIVE: 0.8,
  /** 对话任务 */
  CONVERSATIONAL: 0.7,
} as const

/**
 * 输出格式配置
 */
export const OUTPUT_FORMATS = {
  /** JSON 格式 */
  JSON: {
    instruction:
      '请返回严格的JSON格式（不要用markdown代码块包裹），确保可以直接解析。',
    parseMethod: 'json',
  },
  /** Markdown 格式 */
  MARKDOWN: {
    instruction: '请使用Markdown格式输出，可以使用标题、列表、代码块等。',
    parseMethod: 'markdown',
  },
  /** 分隔符格式（用于避免JSON转义问题） */
  DELIMITER: {
    instruction: `请使用以下分隔符格式输出：
---SCORE---
<分数>
---RECOMMENDATION---
<推荐等级>
---ANALYSIS---
<Markdown分析内容>
---END---`,
    parseMethod: 'delimiter',
  },
  /** 纯文本 */
  TEXT: {
    instruction: '请直接输出纯文本内容。',
    parseMethod: 'text',
  },
} as const

export type OutputFormatType = keyof typeof OUTPUT_FORMATS
