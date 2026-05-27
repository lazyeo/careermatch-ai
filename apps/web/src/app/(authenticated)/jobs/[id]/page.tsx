import { redirect, notFound } from 'next/navigation'
import { getCurrentUser, createClient } from '@/lib/supabase-server'
import Link from 'next/link'
import { Badge, Button, Card, CardContent, ScoreRing } from '@careermatch/ui'
import { ApplyJobButton } from './components/ApplyJobButton'
import { RefreshJobButton } from './components/RefreshJobButton'
import { JobDetailTabs } from './components/JobDetailTabs'
import { JobSummary } from './components/JobSummary'
import { getTranslations, getLocale } from 'next-intl/server'
import { ArrowLeft, Briefcase, Calendar, ExternalLink, MapPin, Pencil, Wallet } from 'lucide-react'
import type { ReactNode } from 'react'

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

  const getStatusTone = (status: string) => {
    const tones: Record<string, 'neutral' | 'brick' | 'sage' | 'ochre' | 'clay' | 'indigo' | 'ghost'> = {
      'saved': 'ghost',
      'applied': 'sage',
      'interview': 'ochre',
      'rejected': 'clay',
      'offer': 'brick',
      'withdrawn': 'ghost',
    }
    return tones[status] || 'ghost'
  }

  const getAnalysisTaskBadge = () => {
    if (!latestProcessingTask) return null

    if (latestProcessingTask.status === 'pending') {
      return {
        label: t('detail.analysisQueued'),
        tone: 'indigo' as const,
        description: t('detail.analysisQueuedDesc'),
      }
    }

    if (latestProcessingTask.status === 'processing') {
      return {
        label: t('detail.analysisRunning'),
        tone: 'ochre' as const,
        description: t('detail.analysisRunningDesc'),
      }
    }

    if (latestProcessingTask.status === 'completed') {
      return {
        label: t('detail.analysisCompleted'),
        tone: 'sage' as const,
        description: t('detail.analysisCompletedDesc'),
      }
    }

    return {
      label: t('detail.analysisFailed'),
      tone: 'clay' as const,
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
    <div className="space-y-6">
      <section className="rounded-lg border border-line bg-surface p-6 shadow-xs">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 flex-1">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <Badge tone={getStatusTone(job.status)}>{getStatusLabel(job.status)}</Badge>
                {analysisTaskBadge && <Badge tone={analysisTaskBadge.tone}>{analysisTaskBadge.label}</Badge>}
              </div>
              <h1 className="font-display text-4xl leading-tight text-ink sm:text-5xl">{job.title}</h1>
              <p className="mt-2 text-lg text-ink-2">{job.company}</p>

              <div className="mt-5 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                {job.location && (
                  <InfoPill icon={<MapPin className="h-4 w-4" />} label={t('location')} value={job.location} />
                )}
                {job.job_type && (
                  <InfoPill icon={<Briefcase className="h-4 w-4" />} label={t('jobType')} value={getJobTypeLabel(job.job_type)} />
                )}
                {(job.salary_min || job.salary_max) && (
                  <InfoPill
                    icon={<Wallet className="h-4 w-4" />}
                    label={t('salaryRange')}
                    value={`${job.salary_currency} ${job.salary_min?.toLocaleString() || '0'}${job.salary_max ? ` - ${job.salary_max.toLocaleString()}` : '+'}`}
                  />
                )}
                <InfoPill icon={<Calendar className="h-4 w-4" />} label={t('updatedAt')} value={new Date(job.updated_at).toLocaleDateString(locale)} />
              </div>

              {sourceUrl && (
                <div className="mt-4 flex min-w-0 items-center gap-2 text-sm text-ink-3">
                    <ExternalLink className="h-4 w-4 flex-none" />
                    <a
                      href={sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="truncate text-brick hover:text-brick-hover"
                    >
                      {sourceUrl}
                    </a>
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <RefreshJobButton jobId={params.id} label={t('refresh')} />
              <Link href={`/jobs/${params.id}/edit`}>
                <Button variant="primary">
                  <Pencil className="h-4 w-4" />
                  {t('edit')}
                </Button>
              </Link>
              <Link href="/jobs">
                <Button variant="secondary">
                  <ArrowLeft className="h-4 w-4" />
                  {t('backToList')}
                </Button>
              </Link>
            </div>
          </div>
      </section>

      {/* Main Content */}
        <JobDetailTabs
          original={originalContent}
          aiInsights={
            <div className="space-y-6">
              <div className="space-y-6">
                <section className="rounded-lg border border-line bg-surface p-5 shadow-xs">
                  <div className="flex flex-col gap-3 border-b border-line pb-4 md:flex-row md:items-end md:justify-between">
                    <div>
                      <p className="cm-eyebrow">{t('detail.decisionKicker')}</p>
                      <h2 className="mt-2 text-xl font-semibold text-ink">{t('detail.decisionTitle')}</h2>
                      <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-2">
                        {t('detail.decisionDesc')}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {latestAnalysis && (
                        <Badge tone="brick">{t('detail.matchScore', { score: latestAnalysis.score })}</Badge>
                      )}
                    </div>
                  </div>

                  <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.9fr)]">
                    <div className="space-y-4">
                      <JobSummary jobId={params.id} initialContent={job.ai_analysis} />
                    </div>

                    <div className="space-y-4">
                      <Card variant="inset">
                        <CardContent className="space-y-4 p-5">
                          <div>
                            <h3 className="text-base font-semibold text-ink">{t('detail.matchAnalysis')}</h3>
                            <p className="mt-1 text-sm text-ink-3">
                              {t('detail.matchAnalysisDesc')}
                            </p>
                          </div>

                          {latestAnalysis ? (
                            <div className="rounded-lg border border-brick-soft bg-brick-tint p-4">
                              <div className="flex items-center gap-4">
                                <ScoreRing value={latestAnalysis.score} label={t('detail.latestResult')} size={96} stroke={8} />
                                <div className="min-w-0">
                                  <div className="text-sm font-medium text-brick-ink">{t('detail.latestResult')}</div>
                                  <div className="mt-1 text-xs text-brick-ink/80">
                                    {new Date(latestAnalysis.created_at).toLocaleDateString(locale)}
                                  </div>
                                </div>
                              </div>
                              <Link href={`/jobs/${params.id}/analysis?mode=profile`} className="mt-4 inline-flex">
                                <Button variant="primary">{t('detail.viewDetailedAnalysis')}</Button>
                              </Link>
                            </div>
                          ) : latestProcessingTask?.status === 'pending' || latestProcessingTask?.status === 'processing' ? (
                            <div className="rounded-lg border border-indigo-soft bg-indigo-soft p-4 text-sm text-indigo">
                              {t('detail.analysisGenerating')}
                            </div>
                          ) : (
                            <div className="rounded-lg border border-line bg-surface p-4 text-sm text-ink-2">
                              {t('detail.analysisEmpty')}
                            </div>
                          )}

                          {latestProcessingTask?.status === 'failed' && (
                            <div className="rounded-lg border border-clay-soft bg-clay-soft p-4 text-sm text-clay">
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

                      <Card variant="inset">
                        <CardContent className="space-y-4 p-5">
                          <div>
                            <h3 className="text-base font-semibold text-ink">{t('detail.nextActions')}</h3>
                            <p className="mt-1 text-sm text-ink-3">
                              {t('detail.nextActionsDesc')}
                            </p>
                          </div>
                          <div className="space-y-3">
                            <Link href={`/jobs/${params.id}/cover-letter`} className="block">
                              <Button variant="secondary" className="w-full justify-between">
                                <span>{t('generateCoverLetter')}</span>
                                <span className="text-xs text-ink-3">{t('detail.optional')}</span>
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
                  <section className="rounded-lg border border-line bg-surface p-5 shadow-xs">
                    <div className="flex items-center justify-between gap-4 border-b border-line pb-4">
                      <div>
                        <h3 className="text-base font-semibold text-ink">{t('detail.generatedMaterials')}</h3>
                        <p className="mt-1 text-sm text-ink-3">
                          {t('detail.generatedMaterialsDesc')}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 grid gap-6 lg:grid-cols-2">
                      {resumes.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold text-ink-2">{t('detail.resumes')}</h4>
                          <div className="mt-3 space-y-2">
                            {resumes.map((resume) => (
                              <Link
                                key={resume.id}
                                href={`/resumes/preview/${resume.id}`}
                                className="block rounded-lg border border-line p-3 transition-colors hover:border-brick-soft hover:bg-brick-tint"
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <div className="font-medium text-ink">{resume.title}</div>
                                    <div className="mt-1 text-sm text-ink-3">
                                      {new Date(resume.created_at).toLocaleDateString(locale)} · {resume.source === 'ai_generated' ? t('detail.sourceGenerated') : t('detail.sourceManual')}
                                    </div>
                                  </div>
                                  <svg className="mt-0.5 h-5 w-5 text-ink-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                          <h4 className="text-sm font-semibold text-ink-2">{t('detail.coverLetters')}</h4>
                          <div className="mt-3 space-y-2">
                            {coverLetters.map((letter) => (
                              <div key={letter.id} className="rounded-lg border border-line p-3">
                                <div className="font-medium text-ink">{letter.title}</div>
                                <div className="mt-1 text-sm text-ink-3">
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
    </div>
  )
}

function InfoPill({
  icon,
  label,
  value,
}: {
  icon: ReactNode
  label: string
  value: string
}) {
  return (
    <div className="flex min-w-0 items-center gap-2 rounded-md bg-surface-2 px-3 py-2 text-ink-2">
      <span className="text-ink-3">{icon}</span>
      <span className="font-medium text-ink">{label}:</span>
      <span className="truncate">{value}</span>
    </div>
  )
}
