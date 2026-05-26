import { redirect, notFound } from 'next/navigation'
import { getCurrentUser, createClient } from '@/lib/supabase-server'
import Link from 'next/link'
import { Button, Card, CardContent } from '@careermatch/ui'
import { ApplyJobButton } from './components/ApplyJobButton'
import { RefreshJobButton } from './components/RefreshJobButton'
import { JobDetailTabs } from './components/JobDetailTabs'
import { JobSummary } from './components/JobSummary'
import { getTranslations, getLocale } from 'next-intl/server'

// Job detail page component
export default async function JobDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login?redirect=/jobs/' + params.id)
  }

  const t = await getTranslations('jobs')
  const locale = await getLocale()

  const supabase = await createClient()

  // Fetch the job
  const { data: job, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()

  if (error || !job) {
    notFound()
  }

  // Fetch related analysis sessions, resumes, cover letters, and latest processing task
  const [analysisResult, resumesResult, coverLettersResult, processingTaskResult] = await Promise.all([
    supabase
      .from('analysis_sessions')
      .select('id, score, recommendation, created_at')
      .eq('job_id', params.id)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1),
    supabase
      .from('resumes')
      .select('id, title, created_at, source')
      .eq('job_id', params.id)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('cover_letters')
      .select('id, title, created_at, source')
      .eq('job_id', params.id)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('processing_tasks')
      .select('id, status, current_step, error, created_at, completed_at')
      .eq('job_id', params.id)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  const latestAnalysis = analysisResult.data?.[0]
  const latestProcessingTask = processingTaskResult.data
  const resumes = resumesResult.data || []
  const coverLetters = coverLettersResult.data || []

  // Helper functions
  const getJobTypeLabel = (type: string | null) => {
    if (!type) return t('notSpecified')
    const typeMap: Record<string, string> = {
      'full-time': 'fullTime',
      'part-time': 'partTime',
      'contract': 'contract',
      'internship': 'internship',
      'casual': 'casual',
    }
    const key = typeMap[type]
    return key ? t(key as keyof typeof t) : type
  }

  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      'saved': 'statusLabels.saved',
      'applied': 'statusLabels.applied',
      'interview': 'statusLabels.interview',
      'rejected': 'statusLabels.rejected',
      'offer': 'statusLabels.offer',
      'withdrawn': 'statusLabels.withdrawn',
    }
    const key = statusMap[status]
    return key ? t(key as keyof typeof t) : status
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'saved': 'bg-neutral-100 text-neutral-800',
      'applied': 'bg-primary-100 text-primary-800',
      'interview': 'bg-warning-100 text-warning-800',
      'rejected': 'bg-error-100 text-error-800',
      'offer': 'bg-success-100 text-success-800',
      'withdrawn': 'bg-neutral-200 text-neutral-600',
    }
    return colors[status] || 'bg-neutral-100 text-neutral-800'
  }

  const getAnalysisTaskBadge = () => {
    if (!latestProcessingTask) return null

    if (latestProcessingTask.status === 'pending') {
      return {
        label: t('detail.analysisQueued'),
        className: 'bg-blue-50 text-blue-700 border-blue-200',
        description: t('detail.analysisQueuedDesc'),
      }
    }

    if (latestProcessingTask.status === 'processing') {
      return {
        label: t('detail.analysisRunning'),
        className: 'bg-amber-50 text-amber-700 border-amber-200',
        description: t('detail.analysisRunningDesc'),
      }
    }

    if (latestProcessingTask.status === 'completed') {
      return {
        label: t('detail.analysisCompleted'),
        className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        description: t('detail.analysisCompletedDesc'),
      }
    }

    return {
      label: t('detail.analysisFailed'),
      className: 'bg-red-50 text-red-700 border-red-200',
      description: latestProcessingTask.error || t('detail.analysisFailedDesc'),
    }
  }

  // Clean source URL
  const sourceUrl = job.source_url?.split(/[\n,]/)[0]?.trim() || job.source_url

  // Construct Original Content
  const originalContent = job.original_content || [
    job.description,
    job.requirements,
    job.benefits
  ].filter(Boolean).join('\n\n---\n\n') || t('noContent')

  const analysisTaskBadge = getAnalysisTaskBadge()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-gray-900">{job.title}</h1>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(job.status)}`}>
                  {getStatusLabel(job.status)}
                </span>
              </div>

              {/* Basic Info Grid in Header */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-sm mt-4">
                <div className="flex items-center gap-2 text-gray-600">
                  <span className="font-medium text-gray-900">{t('companyName')}:</span>
                  {job.company}
                </div>
                {job.location && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <span className="font-medium text-gray-900">{t('location')}:</span>
                    {job.location}
                  </div>
                )}
                {job.job_type && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <span className="font-medium text-gray-900">{t('jobType')}:</span>
                    {getJobTypeLabel(job.job_type)}
                  </div>
                )}
                {(job.salary_min || job.salary_max) && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <span className="font-medium text-gray-900">{t('salaryRange')}:</span>
                    {job.salary_currency} {job.salary_min?.toLocaleString() || '0'}
                    {job.salary_max ? ` - ${job.salary_max.toLocaleString()}` : '+'}
                  </div>
                )}
                <div className="flex items-center gap-2 text-gray-600">
                  <span className="font-medium text-gray-900">{t('updatedAt')}:</span>
                  {new Date(job.updated_at).toLocaleDateString(locale)}
                </div>
                {sourceUrl && (
                  <div className="flex items-center gap-2 text-gray-600 col-span-1 md:col-span-2">
                    <span className="font-medium text-gray-900">{t('sourceUrl')}:</span>
                    <a
                      href={sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:underline truncate max-w-md"
                    >
                      {sourceUrl}
                    </a>
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-2 ml-4">
              <RefreshJobButton jobId={params.id} label={t('refresh')} />
              <Link href={`/jobs/${params.id}/edit`}>
                <Button variant="primary">{t('edit')}</Button>
              </Link>
              <Link href="/jobs">
                <Button variant="outline">{t('backToList')}</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <JobDetailTabs
          original={originalContent}
          aiInsights={
            <div className="space-y-6">
              {/* Job Summary / Critique */}
              <JobSummary jobId={params.id} initialContent={job.ai_analysis} />

              <div className="space-y-6">
                <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                  <div className="flex flex-col gap-3 border-b border-gray-100 pb-4 md:flex-row md:items-end md:justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">{t('detail.decisionKicker')}</p>
                      <h2 className="mt-1 text-xl font-semibold text-gray-950">{t('detail.decisionTitle')}</h2>
                      <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600">
                        {t('detail.decisionDesc')}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {analysisTaskBadge && (
                        <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${analysisTaskBadge.className}`}>
                          {analysisTaskBadge.label}
                        </span>
                      )}
                      {latestAnalysis && (
                        <span className="inline-flex items-center rounded-full border border-primary-200 bg-primary-50 px-3 py-1 text-xs font-medium text-primary-700">
                          {t('detail.matchScore', { score: latestAnalysis.score })}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.9fr)]">
                    <div className="space-y-4">
                      <JobSummary jobId={params.id} initialContent={job.ai_analysis} />
                    </div>

                    <div className="space-y-4">
                      <Card className="border-gray-200 shadow-none">
                        <CardContent className="space-y-4 p-5">
                          <div>
                            <h3 className="text-base font-semibold text-gray-900">{t('detail.matchAnalysis')}</h3>
                            <p className="mt-1 text-sm text-gray-500">
                              {t('detail.matchAnalysisDesc')}
                            </p>
                          </div>

                          {latestAnalysis ? (
                            <div className="rounded-xl border border-primary-200 bg-primary-50 p-4">
                              <div className="text-sm text-primary-700">{t('detail.latestResult')}</div>
                              <div className="mt-2 text-3xl font-semibold text-primary-700">
                                {latestAnalysis.score}/100
                              </div>
                              <div className="mt-1 text-xs text-primary-600">
                                {new Date(latestAnalysis.created_at).toLocaleDateString(locale)}
                              </div>
                              <Link href={`/jobs/${params.id}/analysis?mode=profile`} className="mt-4 inline-flex">
                                <Button variant="primary">{t('detail.viewDetailedAnalysis')}</Button>
                              </Link>
                            </div>
                          ) : latestProcessingTask?.status === 'pending' || latestProcessingTask?.status === 'processing' ? (
                            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-700">
                              {t('detail.analysisGenerating')}
                            </div>
                          ) : (
                            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
                              {t('detail.analysisEmpty')}
                            </div>
                          )}

                          {latestProcessingTask?.status === 'failed' && (
                            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                              {latestProcessingTask.error || t('detail.analysisFailedDesc')}
                            </div>
                          )}

                          {latestProcessingTask?.status === 'pending' || latestProcessingTask?.status === 'processing' ? (
                            <Button variant="primary" className="w-full" disabled>
                              {t('detail.analysisInProgress')}
                            </Button>
                          ) : (
                            <Link href={`/jobs/${params.id}/analysis`} className="block">
                              <Button variant="primary" className="w-full">
                                {latestProcessingTask?.status === 'failed' ? t('detail.restartAnalysis') : t('startAnalysis')}
                              </Button>
                            </Link>
                          )}
                        </CardContent>
                      </Card>

                      <Card className="border-gray-200 shadow-none">
                        <CardContent className="space-y-4 p-5">
                          <div>
                            <h3 className="text-base font-semibold text-gray-900">{t('detail.nextActions')}</h3>
                            <p className="mt-1 text-sm text-gray-500">
                              {t('detail.nextActionsDesc')}
                            </p>
                          </div>
                          <div className="space-y-3">
                            <Link href={`/jobs/${params.id}/cover-letter`} className="block">
                              <Button variant="outline" className="w-full justify-between">
                                <span>{t('generateCoverLetter')}</span>
                                <span className="text-xs text-gray-500">{t('detail.optional')}</span>
                              </Button>
                            </Link>
                            <ApplyJobButton jobId={params.id} />
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </section>

                {(resumes.length > 0 || coverLetters.length > 0) && (
                  <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between gap-4 border-b border-gray-100 pb-4">
                      <div>
                        <h3 className="text-base font-semibold text-gray-900">{t('detail.generatedMaterials')}</h3>
                        <p className="mt-1 text-sm text-gray-500">
                          {t('detail.generatedMaterialsDesc')}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 grid gap-6 lg:grid-cols-2">
                      {resumes.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold text-gray-700">{t('detail.resumes')}</h4>
                          <div className="mt-3 space-y-2">
                            {resumes.map((resume) => (
                              <Link
                                key={resume.id}
                                href={`/resumes/preview/${resume.id}`}
                                className="block rounded-xl border border-gray-200 p-3 transition-colors hover:border-primary-300 hover:bg-primary-50/40"
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <div className="font-medium text-gray-900">{resume.title}</div>
                                    <div className="mt-1 text-sm text-gray-500">
                                      {new Date(resume.created_at).toLocaleDateString(locale)} · {resume.source === 'ai_generated' ? t('detail.sourceGenerated') : t('detail.sourceManual')}
                                    </div>
                                  </div>
                                  <svg className="mt-0.5 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                  </svg>
                                </div>
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}

                      {coverLetters.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold text-gray-700">{t('detail.coverLetters')}</h4>
                          <div className="mt-3 space-y-2">
                            {coverLetters.map((letter) => (
                              <div key={letter.id} className="rounded-xl border border-gray-200 p-3">
                                <div className="font-medium text-gray-900">{letter.title}</div>
                                <div className="mt-1 text-sm text-gray-500">
                                  {new Date(letter.created_at).toLocaleDateString(locale)} · {letter.source === 'ai_generated' ? t('detail.sourceGenerated') : t('detail.sourceManual')}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </section>
                )}
              </div>
            </div>
          }
        />
      </main>
    </div>
  )
}
