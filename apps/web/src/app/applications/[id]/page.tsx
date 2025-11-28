import { createClient, getCurrentUser } from '@/lib/supabase-server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { Button, Card, CardContent, CardHeader, CardTitle } from '@careermatch/ui'
import { Timeline } from '../components/Timeline'
import { StatusUpdater } from '../components/StatusUpdater'
import { DeleteApplicationButton } from '../components/DeleteApplicationButton'
import { getTranslations, getLocale } from 'next-intl/server'

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
    draft: { label: t('draft'), color: 'bg-gray-100 text-gray-800' },
    submitted: { label: t('submitted'), color: 'bg-blue-100 text-blue-800' },
    under_review: { label: t('underReview'), color: 'bg-yellow-100 text-yellow-800' },
    interview_scheduled: { label: t('interviewScheduled'), color: 'bg-purple-100 text-purple-800' },
    offer_received: { label: t('offerReceived'), color: 'bg-green-100 text-green-800' },
    rejected: { label: t('rejected'), color: 'bg-red-100 text-red-800' },
    withdrawn: { label: t('withdrawn'), color: 'bg-gray-100 text-gray-800' },
    accepted: { label: t('accepted'), color: 'bg-teal-100 text-teal-800' },
  }

  const statusConfig = STATUS_CONFIG[application.status as keyof typeof STATUS_CONFIG] || {
    label: application.status,
    color: 'bg-gray-100 text-gray-800',
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900">
                  {job?.title || t('applicationDetail')}
                </h1>
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusConfig.color}`}
                >
                  {statusConfig.label}
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                {job?.company || t('unknownCompany')}
                {job?.location && ` · ${job.location}`}
              </p>
            </div>
            <div className="flex gap-2">
              <Link href={`/jobs/${job?.id}`}>
                <Button variant="outline">{t('viewJob')}</Button>
              </Link>
              <Link href="/applications">
                <Button variant="outline">{t('backToList')}</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                  <p className="text-gray-700 whitespace-pre-wrap">{application.notes}</p>
                ) : (
                  <p className="text-gray-500 italic">{t('noNotes')}</p>
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
                      <p className="text-gray-700 whitespace-pre-wrap">{job.description}</p>
                    </CardContent>
                  </Card>
                )}

                {job.requirements && (
                  <Card>
                    <CardHeader>
                      <CardTitle>{tJobs('requirements')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700 whitespace-pre-wrap">{job.requirements}</p>
                    </CardContent>
                  </Card>
                )}

                {job.benefits && (
                  <Card>
                    <CardHeader>
                      <CardTitle>{tJobs('benefits')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700 whitespace-pre-wrap">{job.benefits}</p>
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
                  <div className="text-sm text-gray-500">{t('applicationTime')}</div>
                  <div className="font-medium text-gray-900">
                    {new Date(application.created_at).toLocaleString(locale)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">{t('lastUpdate')}</div>
                  <div className="font-medium text-gray-900">
                    {new Date(application.updated_at).toLocaleString(locale)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">{t('timelineEvents')}</div>
                  <div className="font-medium text-gray-900">
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
                    <div className="font-medium text-gray-900">
                      {resume.title || resume.content?.personal_info?.full_name || t('unnamedResume')}
                    </div>
                    {resume.content?.personal_info?.full_name && (
                      <div className="text-sm text-gray-600 mt-1">{resume.content.personal_info.full_name}</div>
                    )}
                  </div>
                  <div className="space-y-1 text-sm">
                    {resume.content?.personal_info?.email && (
                      <div className="text-gray-600">
                        📧 {resume.content.personal_info.email}
                      </div>
                    )}
                    {resume.content?.personal_info?.phone && (
                      <div className="text-gray-600">
                        📱 {resume.content.personal_info.phone}
                      </div>
                    )}
                  </div>
                  <Link href={`/resumes/${resume.id}`}>
                    <Button variant="outline" className="w-full mt-2">
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
                    <div className="text-sm text-gray-500">{tJobs('jobType')}</div>
                    <div className="font-medium text-gray-900">
                      {job.job_type === 'full_time' && tJobs('fullTime')}
                      {job.job_type === 'part_time' && tJobs('partTime')}
                      {job.job_type === 'contract' && tJobs('contract')}
                      {job.job_type === 'internship' && tJobs('internship')}
                      {!job.job_type && '-'}
                    </div>
                  </div>
                  {(job.salary_min || job.salary_max) && (
                    <div>
                      <div className="text-sm text-gray-500">{t('salaryRange')}</div>
                      <div className="font-medium text-gray-900">
                        {job.salary_currency || 'NZD'} {job.salary_min?.toLocaleString()} -{' '}
                        {job.salary_max?.toLocaleString()}
                      </div>
                    </div>
                  )}
                  {job.posted_date && (
                    <div>
                      <div className="text-sm text-gray-500">{t('postedDate')}</div>
                      <div className="font-medium text-gray-900">
                        {new Date(job.posted_date).toLocaleDateString(locale)}
                      </div>
                    </div>
                  )}
                  {job.deadline && (
                    <div>
                      <div className="text-sm text-gray-500">{t('applicationDeadline')}</div>
                      <div className="font-medium text-gray-900">
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
                        className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
                      >
                        🔗 {t('viewOriginalLink')}
                        <svg
                          className="w-3 h-3"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                          />
                        </svg>
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
                  <Button variant="outline" className="w-full">
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
