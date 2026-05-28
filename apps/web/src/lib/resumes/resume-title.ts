export function buildGeneratedResumeTitle(job: {
  title?: string | null
  company?: string | null
}): string {
  const title = job.title?.trim() || 'Target Role'
  const company = job.company?.trim()

  return company ? `Resume - ${title} at ${company}` : `Resume - ${title}`
}
