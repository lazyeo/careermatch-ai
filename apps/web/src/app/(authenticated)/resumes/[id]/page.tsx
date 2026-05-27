import { redirect, notFound } from 'next/navigation'
import { getCurrentUser, createClient } from '@/lib/supabase-server'
import Link from 'next/link'
import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from '@careermatch/ui'
import type { ResumeContent } from '@careermatch/shared'
import { ExportPDFButton } from '@/components/ExportPDFButton'
import { getTranslations, getLocale } from 'next-intl/server'

export default async function ResumeDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login?redirect=/resumes/' + params.id)
  }

  const t = await getTranslations('resumes')
  const locale = await getLocale()

  const supabase = await createClient()

  // Fetch the resume
  const { data: resume, error } = await supabase
    .from('resumes')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()

  if (error || !resume) {
    notFound()
  }

  const rawContent = resume.content as Record<string, unknown>

  // Handle both camelCase and snake_case field names for personalInfo
  const rawPersonalInfo = (rawContent.personalInfo || rawContent.personal_info || {}) as Record<string, unknown>
  const personalInfo: ResumeContent['personalInfo'] = {
    fullName: (rawPersonalInfo.fullName || rawPersonalInfo.full_name || '') as string,
    email: (rawPersonalInfo.email || '') as string,
    phone: (rawPersonalInfo.phone || '') as string,
    location: (rawPersonalInfo.location || '') as string,
    linkedIn: (rawPersonalInfo.linkedIn || rawPersonalInfo.linkedin || '') as string,
    github: (rawPersonalInfo.github || '') as string,
  }

  // Handle both camelCase and snake_case field names
  const content: ResumeContent = {
    personalInfo,
    careerObjective: (rawContent.careerObjective || rawContent.career_objective || '') as string,
    skills: (rawContent.skills || []) as ResumeContent['skills'],
    workExperience: (rawContent.workExperience || rawContent.work_experience || []) as ResumeContent['workExperience'],
    projects: (rawContent.projects || []) as ResumeContent['projects'],
    education: (rawContent.education || []) as ResumeContent['education'],
    certifications: (rawContent.certifications || []) as ResumeContent['certifications'],
    interests: (rawContent.interests || []) as string[],
  }

  return (
    <div className="min-h-screen bg-paper">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto max-w-5xl px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="cm-eyebrow">{t('title')}</p>
              <h1 className="font-display text-3xl font-semibold text-ink">{resume.title}</h1>
              <p className="mt-1 text-sm text-ink-3">
                {t('version')} {t('versionPrefix')}{resume.version} · {t('lastUpdatedAt')}{' '}
                {new Date(resume.updated_at).toLocaleDateString(locale)}
              </p>
            </div>
            <div className="flex flex-wrap gap-2 lg:flex-shrink-0">
              <ExportPDFButton resumeId={params.id} resumeTitle={resume.title} />
              <Link href={`/resumes/${params.id}/edit`}>
                <Button variant="primary">{t('edit')}</Button>
              </Link>
              <Link href="/resumes">
                <Button variant="secondary">{t('backToList')}</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        {/* Personal Info */}
        <Card>
          <CardHeader>
            <CardTitle>{t('personalInfo')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex">
                <span className="font-medium w-24">{t('fullName')}:</span>
                <span>{content.personalInfo.fullName}</span>
              </div>
              <div className="flex">
                <span className="font-medium w-24">{t('email')}:</span>
                <span>{content.personalInfo.email}</span>
              </div>
              {content.personalInfo.phone && (
                <div className="flex">
                  <span className="font-medium w-24">{t('phone')}:</span>
                  <span>{content.personalInfo.phone}</span>
                </div>
              )}
              {content.personalInfo.location && (
                <div className="flex">
                  <span className="font-medium w-24">{t('location')}:</span>
                  <span>{content.personalInfo.location}</span>
                </div>
              )}
              {content.personalInfo.linkedIn && (
                <div className="flex">
                  <span className="font-medium w-24">LinkedIn:</span>
                  <a
                    href={content.personalInfo.linkedIn}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brick hover:underline"
                  >
                    {content.personalInfo.linkedIn}
                  </a>
                </div>
              )}
              {content.personalInfo.github && (
                <div className="flex">
                  <span className="font-medium w-24">GitHub:</span>
                  <a
                    href={content.personalInfo.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brick hover:underline"
                  >
                    {content.personalInfo.github}
                  </a>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Career Objective */}
        {content.careerObjective && (
          <Card>
            <CardHeader>
              <CardTitle>{t('careerObjective')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm leading-6 text-ink-2">
                {content.careerObjective}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Skills */}
        {content.skills && content.skills.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>{t('skills')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {content.skills.map((skill, index) => (
                  <Badge key={index} tone="brick">
                    {skill.name}
                    {skill.level && (
                      <span className="ml-2 text-xs">
                        {skill.level === 'beginner' && t('skillLevels.beginner')}
                        {skill.level === 'intermediate' && t('skillLevels.intermediate')}
                        {skill.level === 'expert' && t('skillLevels.expert')}
                      </span>
                    )}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Work Experience */}
        {content.workExperience && content.workExperience.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>{t('workExperience')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {content.workExperience.map((work) => (
                <div key={work.id} className="border-l-2 border-brick pl-4">
                  <h3 className="text-lg font-semibold text-ink">
                    {work.position}
                  </h3>
                  <p className="font-medium text-ink-2">{work.company}</p>
                  <p className="mt-1 text-sm text-ink-3">
                    {work.startDate} - {work.isCurrent ? t('present') : work.endDate}
                    {work.location && ` · ${work.location}`}
                  </p>
                  {work.description && (
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-ink-2">
                      {work.description}
                    </p>
                  )}
                  {work.achievements && work.achievements.length > 0 && (
                    <ul className="mt-2 list-inside list-disc text-sm text-ink-2">
                      {work.achievements.map((achievement, idx) => (
                        <li key={idx}>{achievement}</li>
                      ))}
                    </ul>
                  )}
                  {work.technologies && work.technologies.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {work.technologies.map((tech, idx) => (
                        <Badge key={idx} tone="sage">{tech}</Badge>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Projects */}
        {content.projects && content.projects.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>{t('projects')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {content.projects.map((project) => (
                <div key={project.id} className="border-l-2 border-ochre pl-4">
                  <h3 className="text-lg font-semibold text-ink">
                    {project.name}
                  </h3>
                  {project.role && (
                    <p className="font-medium text-ink-2">{project.role}</p>
                  )}
                  {(project.startDate || project.endDate) && (
                    <p className="mt-1 text-sm text-ink-3">
                      {project.startDate} - {project.endDate || t('present')}
                    </p>
                  )}
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-ink-2">
                    {project.description}
                  </p>
                  {project.highlights && project.highlights.length > 0 && (
                    <ul className="mt-2 list-inside list-disc text-sm text-ink-2">
                      {project.highlights.map((highlight, idx) => (
                        <li key={idx}>{highlight}</li>
                      ))}
                    </ul>
                  )}
                  {project.technologies && project.technologies.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {project.technologies.map((tech, idx) => (
                        <Badge key={idx} tone="sage">{tech}</Badge>
                      ))}
                    </div>
                  )}
                  {project.url && (
                    <a
                      href={project.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-block text-sm text-brick hover:underline"
                    >
                      {t('viewProject')} →
                    </a>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Education */}
        {content.education && content.education.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>{t('education')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {content.education.map((edu) => (
                <div key={edu.id}>
                  <h3 className="text-lg font-semibold text-ink">
                    {edu.degree} - {edu.major}
                  </h3>
                  <p className="font-medium text-ink-2">{edu.institution}</p>
                  <p className="mt-1 text-sm text-ink-3">
                    {edu.startDate} - {edu.endDate}
                    {edu.location && ` · ${edu.location}`}
                  </p>
                  {edu.gpa && (
                    <p className="mt-1 text-sm text-ink-2">GPA: {edu.gpa}</p>
                  )}
                  {edu.achievements && edu.achievements.length > 0 && (
                    <ul className="mt-2 list-inside list-disc text-sm text-ink-2">
                      {edu.achievements.map((achievement, idx) => (
                        <li key={idx}>{achievement}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Certifications */}
        {content.certifications && content.certifications.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>{t('certifications')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {content.certifications.map((cert) => (
                <div key={cert.id}>
                  <h3 className="text-lg font-semibold text-ink">{cert.name}</h3>
                  <p className="text-ink-2">{cert.issuer}</p>
                  <p className="mt-1 text-sm text-ink-3">
                    {t('issueDate')}: {cert.issueDate}
                    {cert.expiryDate && ` · ${t('expiryDate')}: ${cert.expiryDate}`}
                  </p>
                  {cert.credentialId && (
                    <p className="mt-1 text-sm text-ink-2">
                      {t('credentialId')}: {cert.credentialId}
                    </p>
                  )}
                  {cert.url && (
                    <a
                      href={cert.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-block text-sm text-brick hover:underline"
                    >
                      {t('verifyCertificate')} →
                    </a>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Interests */}
        {content.interests && content.interests.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>{t('interests')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {content.interests.map((interest, index) => (
                  <Badge key={index} tone="neutral">{interest}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
