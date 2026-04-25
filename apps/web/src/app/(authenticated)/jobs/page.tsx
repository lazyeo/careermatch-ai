import { createClient, getCurrentUser } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button, Card, CardContent } from '@careermatch/ui'

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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      {/* AppHeader removed in favor of Sidebar layout */}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <section className="mb-8 rounded-2xl border border-gray-200 bg-white px-6 py-6 shadow-sm">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl space-y-2">
              <p className="text-sm font-medium text-gray-500">Job workspace</p>
              <h1 className="text-3xl font-semibold tracking-tight text-gray-950">{t('myJobs')}</h1>
              <p className="text-sm leading-6 text-gray-600">
                Keep the queue focused on high-value decisions: capture the role, let background analysis run,
                then review only the jobs worth moving forward.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/jobs/import">
                <Button variant="outline">{t('smartImport')}</Button>
              </Link>
              <Link href="/jobs/new">
                <Button variant="primary">{t('manualCreate')}</Button>
              </Link>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <SummaryChip label={t('totalJobs')} value={jobCount} />
            <SummaryChip label={t('saved')} value={savedCount} tone="neutral" />
            <SummaryChip label={t('applied')} value={appliedCount} tone="primary" />
            <SummaryChip label={t('interviewing')} value={interviewCount} tone="warning" />
            <SummaryChip label="分析进行中" value={activeAnalysisCount} tone="info" />
          </div>
        </section>

        {jobCount === 0 ? (
          <Card>
            <CardContent className="py-16">
              <div className="text-center">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">{t('noJobsTitle')}</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {t('noJobsDesc')}
                </p>
                <div className="mt-6 flex gap-3 justify-center">
                  <Link href="/jobs/import">
                    <Button variant="outline">{t('smartImport')}</Button>
                  </Link>
                  <Link href="/jobs/new">
                    <Button variant="primary">{t('manualCreate')}</Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            <JobSection
              title={t('board.saved')}
              description="Newly captured roles waiting for a decision. Background analysis status stays visible here so you can avoid opening every job."
              count={savedJobs.length}
              jobs={savedJobs}
              t={t}
            />
            <JobSection
              title={t('board.applied')}
              description="Roles already in motion. Keep this section compact and outcome-focused."
              count={appliedJobs.length}
              jobs={appliedJobs}
              t={t}
            />
            <JobSection
              title={t('board.interview')}
              description="Active opportunities that justify deeper preparation and document work."
              count={interviewJobs.length}
              jobs={interviewJobs}
              t={t}
            />

            {archivedJobs.length > 0 && (
              <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between gap-4 border-b border-gray-100 pb-4">
                  <div>
                    <h2 className="text-base font-semibold text-gray-900">{t('board.archived')}</h2>
                    <p className="mt-1 text-sm text-gray-500">
                      Lower-value historical items stay available, but no longer compete with active decision work.
                    </p>
                  </div>
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                    {archivedJobs.length}
                  </span>
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
      </main>
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
    default: 'border-gray-200 bg-white text-gray-700',
    neutral: 'border-gray-200 bg-gray-50 text-gray-700',
    primary: 'border-primary-200 bg-primary-50 text-primary-700',
    warning: 'border-amber-200 bg-amber-50 text-amber-700',
    info: 'border-blue-200 bg-blue-50 text-blue-700',
  }

  return (
    <div className={`inline-flex items-center gap-3 rounded-full border px-4 py-2 ${toneClassName[tone]}`}>
      <span className="text-xs font-medium uppercase tracking-[0.12em] text-current/80">{label}</span>
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
    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between gap-4 border-b border-gray-100 pb-4">
        <div>
          <h2 className="text-base font-semibold text-gray-900">{title}</h2>
          <p className="mt-1 text-sm text-gray-500">{description}</p>
        </div>
        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">{count}</span>
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {jobs.length > 0 ? jobs.map((job) => <JobCard key={job.id} job={job} t={t} />) : (
          <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-sm text-gray-500">
            No jobs in this section.
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
      label: '等待分析',
      className: 'bg-blue-50 text-blue-700 border-blue-200',
    }
  }

  if (task.status === 'processing') {
    return {
      label: '分析中',
      className: 'bg-amber-50 text-amber-700 border-amber-200',
    }
  }

  if (task.status === 'completed') {
    return {
      label: '已分析',
      className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    }
  }

  return {
    label: '分析失败',
    className: 'bg-red-50 text-red-700 border-red-200',
  }
}

function JobCard({ job, t, compact = false }: JobCardProps) {
  const analysisTaskBadge = getAnalysisTaskBadge(job.latest_processing_task)

  return (
    <Card className="relative overflow-hidden border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      <CardContent className={compact ? 'p-4' : 'p-5'}>
        <div className="flex justify-between items-start mb-2">
          <div className="flex-1 pr-2">
            <Link href={`/jobs/${job.id}`} className="hover:text-primary-600 transition-colors">
              <h4 className="font-semibold text-gray-900 line-clamp-1" title={job.title}>
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
                  className="inline-flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 mt-1"
                >
                  <span>{t('viewOriginal')}</span>
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              )
            })()}
          </div>
        </div>
        <div className="text-sm text-gray-600 font-medium mb-2">{job.company}</div>

        {analysisTaskBadge && (
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${analysisTaskBadge.className}`}>
              {analysisTaskBadge.label}
            </span>
            {job.latest_processing_task?.status === 'failed' && job.latest_processing_task.error && (
              <span className="text-xs text-red-600 line-clamp-1" title={job.latest_processing_task.error}>
                {job.latest_processing_task.error}
              </span>
            )}
          </div>
        )}

        <div className="space-y-1 text-xs text-gray-500 mb-3">
          {job.location && (
            <div className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="line-clamp-1">{job.location}</span>
            </div>
          )}
          {(job.salary_min || job.salary_max) && (
            <div className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>
                {job.salary_currency} {job.salary_min?.toLocaleString()}
                {job.salary_max ? ` - ${job.salary_max.toLocaleString()}` : '+'}
              </span>
            </div>
          )}
        </div>

        <div className="flex gap-2 mt-3">
          <Link href={`/jobs/${job.id}`} className="flex-1">
            <Button variant="outline" className="w-full h-8 text-xs" size="sm">
              {t('view')}
            </Button>
          </Link>
          {/* <DeleteJobButton jobId={job.id} /> */}
        </div>
      </CardContent>
    </Card>
  )
}
