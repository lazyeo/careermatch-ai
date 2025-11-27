export interface Job {
  id: string
  userId: string
  title: string
  company: string
  location: string
  jobType: JobType
  salaryRange?: SalaryRange
  description: string
  requirements: string
  benefits?: string
  postedDate?: Date
  deadline?: Date
  sourceUrl?: string
  status: JobStatus
  createdAt: Date
  updatedAt: Date
}

export type JobType = 'full-time' | 'part-time' | 'contract' | 'internship' | 'casual'

export type JobStatus = 'saved' | 'applied' | 'interview' | 'rejected' | 'offer' | 'withdrawn'

export interface SalaryRange {
  min: number
  max: number
  currency: string
  period: 'hour' | 'year'
}

export interface JobAnalysis {
  jobId: string
  resumeId: string
  matchScore: number
  dimensions: AnalysisDimension[]
  strengths: string[]
  gaps: string[]
  swot: SWOTAnalysis
  keywords: KeywordMatch[]
  createdAt: Date
}

export interface AnalysisDimension {
  name: string
  score: number
  description: string
}

export interface SWOTAnalysis {
  strengths: string[]
  weaknesses: string[]
  opportunities: string[]
  threats: string[]
}

export interface KeywordMatch {
  keyword: string
  inResume: boolean
  importance: 'high' | 'medium' | 'low'
  context?: string
}

// =====================================================
// 新版AI分析系统 - 框架内自主 + 对话式交互
// =====================================================

export type AnalysisSessionStatus = 'active' | 'completed' | 'archived'

export type AnalysisRecommendation = 'strong' | 'moderate' | 'weak' | 'not_recommended'

export interface AnalysisSession {
  id: string
  jobId: string
  resumeId: string
  userId: string
  status: AnalysisSessionStatus
  score: number                         // 0-100 匹配度评分
  recommendation: AnalysisRecommendation
  analysis: string                      // Markdown格式的详细分析
  provider?: string                     // AI提供商
  model?: string                        // 模型名称
  createdAt: Date
  updatedAt: Date
}

export interface AnalysisMessage {
  id: string
  sessionId: string
  role: 'user' | 'assistant'
  content: string                       // Markdown格式
  createdAt: Date
}

// API响应类型
export interface AnalyzeResponse {
  sessionId: string
  score: number
  recommendation: AnalysisRecommendation
  analysis: string
  provider: string
  model: string
}

export interface ChatResponse {
  messageId: string
  response: string                      // Markdown格式
  suggestedQuestions?: string[]
}

// AI输出的JSON格式
export interface AIAnalysisOutput {
  score: number
  recommendation: AnalysisRecommendation
  analysis: string                      // Markdown格式
}
