export interface Resume {
  id: string
  userId: string
  title: string
  version: number
  content: ResumeContent
  templateId?: string
  createdAt: Date
  updatedAt: Date
}

export interface ResumeContent {
  personalInfo: PersonalInfo
  careerObjective?: string
  skills: Skill[]
  workExperience: WorkExperience[]
  projects: Project[]
  education: Education[]
  certifications: Certification[]
  interests?: string[]
}

export interface PersonalInfo {
  fullName: string
  email: string
  phone?: string
  location?: string
  linkedIn?: string
  github?: string
  website?: string
}

export interface Skill {
  name: string
  level?: 'beginner' | 'intermediate' | 'expert'
  years?: number
  category?: string
}

export interface WorkExperience {
  id: string
  company: string
  position: string
  location?: string
  startDate: string
  endDate?: string
  isCurrent: boolean
  description: string
  achievements: string[]
  technologies?: string[]
}

export interface Project {
  id: string
  name: string
  description: string
  role?: string
  startDate?: string
  endDate?: string
  technologies: string[]
  url?: string
  highlights: string[]
}

export interface Education {
  id: string
  institution: string
  degree: string
  major: string
  location?: string
  startDate: string
  endDate?: string
  gpa?: number
  achievements?: string[]
}

export interface Certification {
  id: string
  name: string
  issuer: string
  issueDate: string
  expiryDate?: string
  credentialId?: string
  url?: string
}
