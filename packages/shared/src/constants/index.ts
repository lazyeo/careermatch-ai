export const JOB_TYPES = [
  'full-time',
  'part-time',
  'contract',
  'internship',
  'casual',
] as const

export const JOB_STATUSES = [
  'saved',
  'applied',
  'interview',
  'rejected',
  'offer',
  'withdrawn',
] as const

export const APPLICATION_STATUSES = [
  'draft',
  'submitted',
  'under_review',
  'interview_scheduled',
  'offer_received',
  'rejected',
  'withdrawn',
  'accepted',
] as const

export const SKILL_LEVELS = ['beginner', 'intermediate', 'expert'] as const

export const INTERVIEW_TYPES = [
  'phone_screen',
  'video',
  'in_person',
  'technical',
  'behavioral',
  'panel',
  'final',
] as const

export const MATCH_DIMENSIONS = [
  'Role Alignment',
  'Technical Skills',
  'Experience Level',
  'Industry Match',
  'Education Requirements',
  'Soft Skills',
  'Company Culture',
  'Growth Potential',
  'Compensation',
] as const

export const NZ_CITIES = [
  'Auckland',
  'Wellington',
  'Christchurch',
  'Hamilton',
  'Tauranga',
  'Dunedin',
  'Palmerston North',
  'Napier',
  'Porirua',
  'New Plymouth',
] as const
