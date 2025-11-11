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
