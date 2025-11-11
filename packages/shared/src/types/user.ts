export interface User {
  id: string
  email: string
  fullName: string
  avatarUrl?: string
  createdAt: Date
  updatedAt: Date
}

export interface UserProfile {
  userId: string
  personalInfo: {
    name: string
    email: string
    phone?: string
    location?: string
  }
  jobPreferences: JobPreferences
  skills: string[]
  workHistory: WorkHistorySummary[]
  education: EducationSummary[]
}

export interface JobPreferences {
  targetRoles: string[]
  desiredLocations: string[]
  jobTypes: ('full-time' | 'part-time' | 'contract' | 'internship' | 'casual')[]
  salaryExpectation?: {
    min: number
    max: number
    currency: string
  }
  remotePreference: 'remote' | 'hybrid' | 'onsite' | 'flexible'
  willingToRelocate: boolean
}

export interface WorkHistorySummary {
  company: string
  role: string
  duration: string
  current: boolean
}

export interface EducationSummary {
  institution: string
  degree: string
  major: string
  year: number
}
