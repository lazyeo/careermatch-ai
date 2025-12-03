import { redirect, notFound } from 'next/navigation'
import { getCurrentUser, createClient } from '@/lib/supabase-server'
import Link from 'next/link'
import { Button, Card, CardContent, CardHeader, CardTitle } from '@careermatch/ui'
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{resume.title}</h1>
              <p className="text-sm text-gray-600 mt-1">
                {t('version')} {t('versionPrefix')}{resume.version} · {t('lastUpdatedAt')}{' '}
                {new Date(resume.updated_at).toLocaleDateString(locale)}
              </p>
            </div>
            <div className="flex gap-2">
              <ExportPDFButton resumeId={params.id} resumeTitle={resume.title} />
              <Link href={`/resumes/${params.id}/edit`}>
                <Button variant="primary">{t('edit')}</Button>
              </Link>
              <Link href="/resumes">
                <Button variant="outline">{t('backToList')}</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
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
                    className="text-primary-600 hover:underline"
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
                    className="text-primary-600 hover:underline"
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
              <p className="text-gray-700 whitespace-pre-wrap">
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
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-800"
                  >
                    {skill.name}
                    {skill.level && (
                      <span className="ml-2 text-xs">
                        {skill.level === 'beginner' && t('skillLevels.beginner')}
                        {skill.level === 'intermediate' && t('skillLevels.intermediate')}
                        {skill.level === 'expert' && t('skillLevels.expert')}
                      </span>
                    )}
                  </span>
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
                <div key={work.id} className="border-l-4 border-primary-500 pl-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {work.position}
                  </h3>
                  <p className="text-gray-600 font-medium">{work.company}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {work.startDate} - {work.isCurrent ? t('present') : work.endDate}
                    {work.location && ` · ${work.location}`}
                  </p>
                  {work.description && (
                    <p className="mt-3 text-gray-700 whitespace-pre-wrap">
                      {work.description}
                    </p>
                  )}
                  {work.achievements && work.achievements.length > 0 && (
                    <ul className="mt-2 list-disc list-inside text-gray-700">
                      {work.achievements.map((achievement, idx) => (
                        <li key={idx}>{achievement}</li>
                      ))}
                    </ul>
                  )}
                  {work.technologies && work.technologies.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {work.technologies.map((tech, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 text-xs rounded bg-gray-200 text-gray-700"
                        >
                          {tech}
                        </span>
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
                <div key={project.id} className="border-l-4 border-accent-500 pl-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {project.name}
                  </h3>
                  {project.role && (
                    <p className="text-gray-600 font-medium">{project.role}</p>
                  )}
                  {(project.startDate || project.endDate) && (
                    <p className="text-sm text-gray-500 mt-1">
                      {project.startDate} - {project.endDate || t('present')}
                    </p>
                  )}
                  <p className="mt-3 text-gray-700 whitespace-pre-wrap">
                    {project.description}
                  </p>
                  {project.highlights && project.highlights.length > 0 && (
                    <ul className="mt-2 list-disc list-inside text-gray-700">
                      {project.highlights.map((highlight, idx) => (
                        <li key={idx}>{highlight}</li>
                      ))}
                    </ul>
                  )}
                  {project.technologies && project.technologies.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {project.technologies.map((tech, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 text-xs rounded bg-gray-200 text-gray-700"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  )}
                  {project.url && (
                    <a
                      href={project.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:underline text-sm mt-2 inline-block"
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
                  <h3 className="text-lg font-semibold text-gray-900">
                    {edu.degree} - {edu.major}
                  </h3>
                  <p className="text-gray-600 font-medium">{edu.institution}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {edu.startDate} - {edu.endDate}
                    {edu.location && ` · ${edu.location}`}
                  </p>
                  {edu.gpa && (
                    <p className="text-sm text-gray-600 mt-1">GPA: {edu.gpa}</p>
                  )}
                  {edu.achievements && edu.achievements.length > 0 && (
                    <ul className="mt-2 list-disc list-inside text-gray-700">
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
                  <h3 className="text-lg font-semibold text-gray-900">{cert.name}</h3>
                  <p className="text-gray-600">{cert.issuer}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {t('issueDate')}: {cert.issueDate}
                    {cert.expiryDate && ` · ${t('expiryDate')}: ${cert.expiryDate}`}
                  </p>
                  {cert.credentialId && (
                    <p className="text-sm text-gray-600 mt-1">
                      {t('credentialId')}: {cert.credentialId}
                    </p>
                  )}
                  {cert.url && (
                    <a
                      href={cert.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:underline text-sm mt-1 inline-block"
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
                  <span
                    key={index}
                    className="px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-700"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
