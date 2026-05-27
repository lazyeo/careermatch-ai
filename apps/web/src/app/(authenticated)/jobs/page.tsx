import { createClient, getCurrentUser } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Badge, Button, Card, CardContent, EmptyState } from '@careermatch/ui'
import { Briefcase, DollarSign, ExternalLink, MapPin, PlusCircle, Search } from 'lucide-react'

import { getTranslations } from 'next-intl/server'

export default async function JobsPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login?redirect=/jobs')
  }

  const t = await getTranslations('jobs')


  const supabase = await createClient()



  // Fetch user's jobs
  const { data: jobs, error } = await supabase
    .from('jobs')
    .select('id, title, company, location, salary_min, salary_max, salary_currency, source_url, status, created_at, updated_at, user_id')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })

  const jobIds = jobs?.map((job) => job.id) || []
  const processingTasksResult = jobIds.length
    ? await supabase
        .from('processing_tasks')
        .select('id, job_id, status, current_step, error, created_at, completed_at')
        .eq('user_id', user.id)
        .in('job_id', jobIds)
        .order('created_at', { ascending: false })
    : { data: [], error: null }

  const latestTaskByJobId = new Map<string, {
    id: string
    job_id: string
    status: string
    current_step: string | null
    error: string | null
    created_at: string
    completed_at: string | null
  }>()

  for (const task of processingTasksResult.data || []) {
    if (!latestTaskByJobId.has(task.job_id)) {
      latestTaskByJobId.set(task.job_id, task)
    }
  }

  const jobsWithAnalysisState =
    jobs?.map((job) => ({
      ...job,
      latest_processing_task: latestTaskByJobId.get(job.id) || null,
    })) || []

  console.log('🔍 [Dashboard] Current User:', user.id)
  console.log('🔍 [Dashboard] Fetched Jobs:', jobs?.length)
  if (jobs && jobs.length > 0) {
    console.log('🔍 [Dashboard] Top 5 Jobs:')
    jobs.slice(0, 5).forEach((j, i) => {
      console.log(`   ${i + 1}. ${j.title} (Status: ${j.status}, Updated: ${j.updated_at})`)
    })
  }

  if (error) {
    console.error('Error fetching jobs:', error)
  }

  const jobCount = jobsWithAnalysisState.length
  const savedCount = jobsWithAnalysisState.filter(j => j.status === 'saved').length || 0
  const appliedCount = jobsWithAnalysisState.filter(j => j.status === 'applied').length || 0
  const interviewCount = jobsWithAnalysisState.filter(j => j.status === 'interview').length || 0
  const activeAnalysisCount = jobsWithAnalysisState.filter(
    (job) => job.latest_processing_task?.status === 'pending' || job.latest_processing_task?.status === 'processing'
  ).length

  const savedJobs = jobsWithAnalysisState.filter((job) => job.status === 'saved')
  const appliedJobs = jobsWithAnalysisState.filter((job) => job.status === 'applied')
  const interviewJobs = jobsWithAnalysisState.filter((job) => job.status === 'interview')
  const archivedJobs = jobsWithAnalysisState.filter((job) => ['rejected', 'offer', 'withdrawn'].includes(job.status))

  return (
    <div className="space-y-8">
        <section className="rounded-lg border border-line bg-surface px-6 py-6 shadow-xs">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl space-y-2">
              <p className="cm-eyebrow">{t('workspaceKicker')}</p>
              <h1 className="font-display text-4xl leading-tight text-ink sm:text-5xl">{t('myJobs')}</h1>
              <p className="text-sm leading-6 text-ink-2">
                {t('workspaceDescription')}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/jobs/import">
                <Button variant="secondary">
                  <Search className="h-4 w-4" />
                  {t('smartImport')}
                </Button>
              </Link>
              <Link href="/jobs/new">
                <Button variant="primary">
                  <PlusCircle className="h-4 w-4" />
                  {t('manualCreate')}
                </Button>
              </Link>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <SummaryChip label={t('totalJobs')} value={jobCount} />
            <SummaryChip label={t('saved')} value={savedCount} tone="neutral" />
            <SummaryChip label={t('applied')} value={appliedCount} tone="primary" />
            <SummaryChip label={t('interviewing')} value={interviewCount} tone="warning" />
            <SummaryChip label={t('activeAnalysis')} value={activeAnalysisCount} tone="info" />
          </div>
        </section>

        {jobCount === 0 ? (
          <EmptyState
            icon={<Briefcase className="h-5 w-5" />}
            title={t('noJobsTitle')}
            description={t('noJobsDesc')}
            action={
              <div className="flex flex-wrap justify-center gap-3">
                <Link href="/jobs/import">
                  <Button variant="secondary">{t('smartImport')}</Button>
                </Link>
                <Link href="/jobs/new">
                  <Button variant="primary">{t('manualCreate')}</Button>
                </Link>
              </div>
            }
          />
        ) : (
          <div className="space-y-8">
            <JobSection
              title={t('board.saved')}
              description={t('sectionDescriptions.saved')}
              count={savedJobs.length}
              jobs={savedJobs}
              t={t}
            />
            <JobSection
              title={t('board.applied')}
              description={t('sectionDescriptions.applied')}
              count={appliedJobs.length}
              jobs={appliedJobs}
              t={t}
            />
            <JobSection
              title={t('board.interview')}
              description={t('sectionDescriptions.interview')}
              count={interviewJobs.length}
              jobs={interviewJobs}
              t={t}
            />

            {archivedJobs.length > 0 && (
              <section className="rounded-lg border border-line bg-surface p-5 shadow-xs">
                <div className="flex items-center justify-between gap-4 border-b border-line pb-4">
                  <div>
                    <h2 className="text-base font-semibold text-ink">{t('board.archived')}</h2>
                    <p className="mt-1 text-sm text-ink-3">
                      {t('sectionDescriptions.archived')}
                    </p>
                  </div>
                  <Badge tone="ghost" plain>{archivedJobs.length}</Badge>
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {archivedJobs.map((job) => (
                    <JobCard key={job.id} job={job} t={t} compact />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
    </div>
  )
}

interface Job {
  id: string
  title: string
  company: string
  location?: string | null
  salary_min?: number | null
  salary_max?: number | null
  salary_currency?: string | null
  source_url?: string | null
  status: string
  created_at: string
  updated_at: string
  user_id: string
  description?: string | null
  latest_processing_task?: {
    id: string
    status: string
    current_step: string | null
    error: string | null
    created_at: string
    completed_at: string | null
  } | null
}

interface JobCardProps {
  job: Job
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: any
  compact?: boolean
}

function SummaryChip({
  label,
  value,
  tone = 'default',
}: {
  label: string
  value: number
  tone?: 'default' | 'neutral' | 'primary' | 'warning' | 'info'
}) {
  const toneClassName: Record<NonNullable<typeof tone>, string> = {
    default: 'border-line bg-surface text-ink-2',
    neutral: 'border-line bg-surface-2 text-ink-2',
    primary: 'border-sage-soft bg-sage-soft text-sage',
    warning: 'border-ochre-soft bg-ochre-soft text-ochre',
    info: 'border-indigo-soft bg-indigo-soft text-indigo',
  }

  return (
    <div className={`inline-flex items-center gap-3 rounded-full border px-4 py-2 ${toneClassName[tone]}`}>
      <span className="text-xs font-medium uppercase tracking-[0.08em] text-current/80">{label}</span>
      <span className="text-sm font-semibold text-current">{value}</span>
    </div>
  )
}

function JobSection({
  title,
  description,
  count,
  jobs,
  t,
}: {
  title: string
  description: string
  count: number
  jobs: Job[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: any
}) {
  return (
    <section className="rounded-lg border border-line bg-surface p-5 shadow-xs">
      <div className="flex items-center justify-between gap-4 border-b border-line pb-4">
        <div>
          <h2 className="text-base font-semibold text-ink">{title}</h2>
          <p className="mt-1 text-sm text-ink-3">{description}</p>
        </div>
        <Badge tone="ghost" plain>{count}</Badge>
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {jobs.length > 0 ? jobs.map((job) => <JobCard key={job.id} job={job} t={t} />) : (
          <div className="rounded-lg border border-dashed border-line-strong bg-surface-2 px-4 py-6 text-sm text-ink-3">
            {t('sectionEmpty')}
          </div>
        )}
      </div>
    </section>
  )
}

function getAnalysisTaskBadge(task?: Job['latest_processing_task']) {
  if (!task) return null

  if (task.status === 'pending') {
    return {
      labelKey: 'analysisStatus.pending',
      tone: 'indigo' as const,
    }
  }

  if (task.status === 'processing') {
    return {
      labelKey: 'analysisStatus.processing',
      tone: 'ochre' as const,
    }
  }

  if (task.status === 'completed') {
    return {
      labelKey: 'analysisStatus.completed',
      tone: 'sage' as const,
    }
  }

  return {
    labelKey: 'analysisStatus.failed',
    tone: 'clay' as const,
  }
}

function JobCard({ job, t, compact = false }: JobCardProps) {
  const analysisTaskBadge = getAnalysisTaskBadge(job.latest_processing_task)

  return (
    <Card variant="interactive" className="relative h-full overflow-hidden">
      <CardContent className={compact ? 'p-4' : 'p-5'}>
        <div className="mb-2 flex items-start justify-between">
          <div className="flex-1 pr-2">
            <Link href={`/jobs/${job.id}`} className="transition-colors hover:text-brick">
              <h4 className="line-clamp-2 font-semibold leading-6 text-ink" title={job.title}>
                {job.title}
              </h4>
            </Link>
            {job.source_url && (() => {
              const cleanUrl = job.source_url.split(/[\n,]/)[0]?.trim()
              if (!cleanUrl) return null
              return (
                <a
                  href={cleanUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-flex items-center gap-1 text-xs text-brick hover:text-brick-hover"
                >
                  <span>{t('viewOriginal')}</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              )
            })()}
          </div>
        </div>
        <div className="mb-2 text-sm font-medium text-ink-2">{job.company}</div>

        {analysisTaskBadge && (
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Badge tone={analysisTaskBadge.tone}>{t(analysisTaskBadge.labelKey)}</Badge>
            {job.latest_processing_task?.status === 'failed' && job.latest_processing_task.error && (
              <span className="line-clamp-1 text-xs text-clay" title={job.latest_processing_task.error}>
                {job.latest_processing_task.error}
              </span>
            )}
          </div>
        )}

        <div className="mb-3 space-y-1 text-xs text-ink-3">
          {job.location && (
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" />
              <span className="line-clamp-1">{job.location}</span>
            </div>
          )}
          {(job.salary_min || job.salary_max) && (
            <div className="flex items-center gap-1.5">
              <DollarSign className="h-3.5 w-3.5" />
              <span>
                {job.salary_currency} {job.salary_min?.toLocaleString()}
                {job.salary_max ? ` - ${job.salary_max.toLocaleString()}` : '+'}
              </span>
            </div>
          )}
        </div>

        <div className="flex gap-2 mt-3">
          <Link href={`/jobs/${job.id}`} className="flex-1">
            <Button variant="secondary" className="h-8 w-full text-xs" size="sm">
              {t('view')}
            </Button>
          </Link>
          {/* <DeleteJobButton jobId={job.id} /> */}
        </div>
      </CardContent>
    </Card>
  )
}
