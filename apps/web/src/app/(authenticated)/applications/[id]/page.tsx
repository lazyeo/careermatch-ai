import { createClient, getCurrentUser } from '@/lib/supabase-server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from '@careermatch/ui'
import { Timeline } from '../components/Timeline'
import { StatusUpdater } from '../components/StatusUpdater'
import { DeleteApplicationButton } from '../components/DeleteApplicationButton'
import { getTranslations, getLocale } from 'next-intl/server'
import { ExternalLink } from 'lucide-react'

interface PageProps {
  params: {
    id: string
  }
}

export default async function ApplicationDetailPage({ params }: PageProps) {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login?redirect=/applications')
  }

  const t = await getTranslations('applications')
  const tJobs = await getTranslations('jobs')
  const locale = await getLocale()

  const supabase = await createClient()

  // Fetch application with related data
  const { data: application, error } = await supabase
    .from('applications')
    .select(`
      *,
      jobs:job_id (
        id,
        title,
        company,
        location,
        status,
        job_type,
        salary_min,
        salary_max,
        salary_currency,
        description,
        requirements,
        benefits,
        source_url,
        posted_date,
        deadline
      ),
      resumes:resume_id (
        id,
        title,
        content
      )
    `)
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()

  if (error || !application) {
    notFound()
  }

  const job = application.jobs
  const resume = application.resumes

  const STATUS_CONFIG = {
    draft: { label: t('draft'), tone: 'neutral' },
    submitted: { label: t('submitted'), tone: 'indigo' },
    under_review: { label: t('underReview'), tone: 'ochre' },
    interview_scheduled: { label: t('interviewScheduled'), tone: 'brick' },
    offer_received: { label: t('offerReceived'), tone: 'sage' },
    rejected: { label: t('rejected'), tone: 'clay' },
    withdrawn: { label: t('withdrawn'), tone: 'ghost' },
    accepted: { label: t('accepted'), tone: 'sage' },
  }

  const statusConfig = STATUS_CONFIG[application.status as keyof typeof STATUS_CONFIG] || {
    label: application.status,
    tone: 'neutral',
  }

  return (
    <div className="min-h-screen bg-paper">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex-1">
              <p className="cm-eyebrow">{t('applicationDetail')}</p>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="font-display text-3xl font-semibold text-ink">
                  {job?.title || t('applicationDetail')}
                </h1>
                <Badge tone={statusConfig.tone as 'neutral' | 'brick' | 'sage' | 'ochre' | 'clay' | 'indigo' | 'ghost'}>
                  {statusConfig.label}
                </Badge>
              </div>
              <p className="mt-1 text-sm text-ink-3">
                {job?.company || t('unknownCompany')}
                {job?.location && ` · ${job.location}`}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href={`/jobs/${job?.id}`}>
                <Button variant="secondary">{t('viewJob')}</Button>
              </Link>
              <Link href="/applications">
                <Button variant="ghost">{t('backToList')}</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status Management */}
            <Card>
              <CardHeader>
                <CardTitle>{t('statusManagement')}</CardTitle>
              </CardHeader>
              <CardContent>
                <StatusUpdater applicationId={application.id} currentStatus={application.status} />
              </CardContent>
            </Card>

            {/* Timeline */}
            <Card>
              <CardHeader>
                <CardTitle>{t('timeline')}</CardTitle>
              </CardHeader>
              <CardContent>
                <Timeline events={application.timeline || []} />
              </CardContent>
            </Card>

            {/* Notes */}
            <Card>
              <CardHeader>
                <CardTitle>{t('notes')}</CardTitle>
              </CardHeader>
              <CardContent>
                {application.notes ? (
                  <p className="whitespace-pre-wrap text-sm leading-6 text-ink-2">{application.notes}</p>
                ) : (
                  <p className="text-sm italic text-ink-3">{t('noNotes')}</p>
                )}
              </CardContent>
            </Card>

            {/* Job Details */}
            {job && (
              <>
                {job.description && (
                  <Card>
                    <CardHeader>
                      <CardTitle>{tJobs('description')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="whitespace-pre-wrap text-sm leading-6 text-ink-2">{job.description}</p>
                    </CardContent>
                  </Card>
                )}

                {job.requirements && (
                  <Card>
                    <CardHeader>
                      <CardTitle>{tJobs('requirements')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="whitespace-pre-wrap text-sm leading-6 text-ink-2">{job.requirements}</p>
                    </CardContent>
                  </Card>
                )}

                {job.benefits && (
                  <Card>
                    <CardHeader>
                      <CardTitle>{tJobs('benefits')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="whitespace-pre-wrap text-sm leading-6 text-ink-2">{job.benefits}</p>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Application Info */}
            <Card>
              <CardHeader>
                <CardTitle>{t('applicationInfo')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-sm text-ink-3">{t('applicationTime')}</div>
                  <div className="font-medium text-ink">
                    {new Date(application.created_at).toLocaleString(locale)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-ink-3">{t('lastUpdate')}</div>
                  <div className="font-medium text-ink">
                    {new Date(application.updated_at).toLocaleString(locale)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-ink-3">{t('timelineEvents')}</div>
                  <div className="font-medium text-ink">
                    {t('eventsCount', { count: application.timeline?.length || 0 })}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Resume Info */}
            {resume && (
              <Card>
                <CardHeader>
                  <CardTitle>{t('resumeUsed')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <div className="font-medium text-ink">
                      {resume.title || resume.content?.personal_info?.full_name || t('unnamedResume')}
                    </div>
                    {resume.content?.personal_info?.full_name && (
                      <div className="mt-1 text-sm text-ink-2">{resume.content.personal_info.full_name}</div>
                    )}
                  </div>
                  <div className="space-y-1 text-sm">
                    {resume.content?.personal_info?.email && (
                      <div className="text-ink-2">
                        📧 {resume.content.personal_info.email}
                      </div>
                    )}
                    {resume.content?.personal_info?.phone && (
                      <div className="text-ink-2">
                        📱 {resume.content.personal_info.phone}
                      </div>
                    )}
                  </div>
                  <Link href={`/resumes/${resume.id}`}>
                    <Button variant="secondary" className="w-full mt-2">
                      {t('viewResume')}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}

            {/* Job Details Summary */}
            {job && (
              <Card>
                <CardHeader>
                  <CardTitle>{t('jobInfo')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <div className="text-sm text-ink-3">{tJobs('jobType')}</div>
                    <div className="font-medium text-ink">
                      {job.job_type === 'full_time' && tJobs('fullTime')}
                      {job.job_type === 'part_time' && tJobs('partTime')}
                      {job.job_type === 'contract' && tJobs('contract')}
                      {job.job_type === 'internship' && tJobs('internship')}
                      {!job.job_type && '-'}
                    </div>
                  </div>
                  {(job.salary_min || job.salary_max) && (
                    <div>
                      <div className="text-sm text-ink-3">{t('salaryRange')}</div>
                      <div className="font-medium text-ink">
                        {job.salary_currency || 'NZD'} {job.salary_min?.toLocaleString()} -{' '}
                        {job.salary_max?.toLocaleString()}
                      </div>
                    </div>
                  )}
                  {job.posted_date && (
                    <div>
                      <div className="text-sm text-ink-3">{t('postedDate')}</div>
                      <div className="font-medium text-ink">
                        {new Date(job.posted_date).toLocaleDateString(locale)}
                      </div>
                    </div>
                  )}
                  {job.deadline && (
                    <div>
                      <div className="text-sm text-ink-3">{t('applicationDeadline')}</div>
                      <div className="font-medium text-ink">
                        {new Date(job.deadline).toLocaleDateString(locale)}
                      </div>
                    </div>
                  )}
                  {job.source_url && (
                    <div>
                      <a
                        href={job.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-sm text-brick hover:text-brick-ink"
                      >
                        {t('viewOriginalLink')}
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle>{t('actions')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link href={`/jobs/${job?.id}/analysis`} className="block">
                  <Button variant="secondary" className="w-full">
                    {t('viewAIAnalysis')}
                  </Button>
                </Link>
                <DeleteApplicationButton applicationId={application.id} />
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
