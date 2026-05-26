import type { ResumeContent } from '@careermatch/shared'

export const ONE_PAGE_TWO_COLUMN_UNIT_LIMIT = 72

const MAX_ONE_PAGE_SUMMARY_CHARS = 320
const MAX_ONE_PAGE_DESCRIPTION_CHARS = 220
const MAX_ONE_PAGE_BULLET_CHARS = 175
const MAX_ONE_PAGE_PROJECT_CHARS = 180

export function shouldUseTwoColumnResumeLayout(content: ResumeContent): boolean {
  return estimateResumeContentUnits(content) <= ONE_PAGE_TWO_COLUMN_UNIT_LIMIT
}

export function fitResumeContentToOnePageBudget(content: ResumeContent): ResumeContent {
  const compact: ResumeContent = {
    ...content,
    careerObjective: clampText(content.careerObjective, MAX_ONE_PAGE_SUMMARY_CHARS),
    skills: uniqueSkills(content.skills || []).slice(0, 18),
    workExperience: (content.workExperience || []).slice(0, 3).map((experience) => ({
      ...experience,
      description: clampRequiredText(experience.description, MAX_ONE_PAGE_DESCRIPTION_CHARS),
      achievements: (experience.achievements || [])
        .slice(0, 3)
        .map((achievement) => clampRequiredText(achievement, MAX_ONE_PAGE_BULLET_CHARS)),
    })),
    projects: (content.projects || []).slice(0, 2).map((project) => ({
      ...project,
      description: clampRequiredText(project.description, MAX_ONE_PAGE_PROJECT_CHARS),
      technologies: (project.technologies || []).slice(0, 8),
      highlights: (project.highlights || [])
        .slice(0, 2)
        .map((highlight) => clampRequiredText(highlight, MAX_ONE_PAGE_BULLET_CHARS)),
    })),
    education: (content.education || []).slice(0, 2),
    certifications: (content.certifications || []).slice(0, 3),
  }

  if (estimateResumeContentUnits(compact) <= ONE_PAGE_TWO_COLUMN_UNIT_LIMIT) {
    return compact
  }

  return {
    ...compact,
    careerObjective: clampText(compact.careerObjective, 240),
    skills: compact.skills.slice(0, 14),
    workExperience: compact.workExperience.slice(0, 2).map((experience) => ({
      ...experience,
      description: clampRequiredText(experience.description, 160),
      achievements: (experience.achievements || [])
        .slice(0, 2)
        .map((achievement) => clampRequiredText(achievement, 145)),
    })),
    projects: compact.projects.slice(0, 1).map((project) => ({
      ...project,
      description: clampRequiredText(project.description, 140),
      highlights: (project.highlights || []).slice(0, 1),
    })),
    certifications: compact.certifications.slice(0, 2),
  }
}

export function estimateResumeContentUnits(content: ResumeContent): number {
  const summaryUnits = textUnits(content.careerObjective, 95)
  const skillUnits = Math.ceil((content.skills?.length || 0) / 4)
  const workUnits = (content.workExperience || []).reduce((total, experience) => {
    const achievementUnits = (experience.achievements || []).reduce(
      (sum, achievement) => sum + 1 + textUnits(achievement, 120),
      0
    )

    return (
      total +
      4 +
      textUnits(experience.description, 120) +
      achievementUnits
    )
  }, 0)
  const projectUnits = (content.projects || []).reduce((total, project) => {
    return (
      total +
      3 +
      textUnits(project.description, 120) +
      (project.highlights || []).reduce(
        (sum, highlight) => sum + 1 + textUnits(highlight, 120),
        0
      ) +
      Math.ceil((project.technologies?.length || 0) / 5)
    )
  }, 0)
  const educationUnits = (content.education?.length || 0) * 3
  const certificationUnits = (content.certifications?.length || 0) * 2

  return summaryUnits + skillUnits + workUnits + projectUnits + educationUnits + certificationUnits
}

function textUnits(value: string | undefined, charsPerUnit: number): number {
  if (!value) return 0
  return Math.ceil(value.trim().length / charsPerUnit)
}

function clampText(value: string | undefined, maxLength: number): string | undefined {
  if (!value || value.length <= maxLength) return value

  const truncated = value.slice(0, maxLength).trim()
  const sentenceEnd = Math.max(
    truncated.lastIndexOf('.'),
    truncated.lastIndexOf('!'),
    truncated.lastIndexOf('?')
  )

  if (sentenceEnd > maxLength * 0.55) {
    return truncated.slice(0, sentenceEnd + 1)
  }

  const lastSpace = truncated.lastIndexOf(' ')
  return `${truncated.slice(0, lastSpace > 0 ? lastSpace : maxLength).trim()}...`
}

function clampRequiredText(value: string | undefined, maxLength: number): string {
  return clampText(value, maxLength) || ''
}

function uniqueSkills(skills: ResumeContent['skills']): ResumeContent['skills'] {
  const seen = new Set<string>()
  return skills.filter((skill) => {
    const key = skill.name.trim().toLowerCase()
    if (!key || seen.has(key)) return false
    seen.add(key)
    return true
  })
}
