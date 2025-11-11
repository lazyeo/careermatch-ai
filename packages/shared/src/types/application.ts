export interface Application {
  id: string
  userId: string
  jobId: string
  resumeId: string
  status: ApplicationStatus
  timeline: TimelineEvent[]
  interviews: Interview[]
  notes?: string
  createdAt: Date
  updatedAt: Date
}

export type ApplicationStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'interview_scheduled'
  | 'offer_received'
  | 'rejected'
  | 'withdrawn'
  | 'accepted'

export interface TimelineEvent {
  id: string
  type: TimelineEventType
  date: Date
  title: string
  description?: string
  attachments?: Attachment[]
}

export type TimelineEventType =
  | 'created'
  | 'submitted'
  | 'viewed'
  | 'contacted'
  | 'interview_scheduled'
  | 'interview_completed'
  | 'offer_received'
  | 'rejected'
  | 'withdrawn'
  | 'accepted'
  | 'note_added'

export interface Interview {
  id: string
  type: InterviewType
  date: Date
  duration?: number
  location?: string
  interviewers?: string[]
  notes?: string
  status: InterviewStatus
  preparationMaterials?: string[]
}

export type InterviewType =
  | 'phone_screen'
  | 'video'
  | 'in_person'
  | 'technical'
  | 'behavioral'
  | 'panel'
  | 'final'

export type InterviewStatus =
  | 'scheduled'
  | 'completed'
  | 'cancelled'
  | 'rescheduled'

export interface Attachment {
  id: string
  name: string
  type: string
  url: string
  size: number
  uploadedAt: Date
}
