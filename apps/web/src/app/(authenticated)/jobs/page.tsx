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
    .select('*')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })

  if (error) {
    console.error('Error fetching jobs:', error)
  }

  const jobCount = jobs?.length || 0
  const savedCount = jobs?.filter(j => j.status === 'saved').length || 0
  const appliedCount = jobs?.filter(j => j.status === 'applied').length || 0
  const interviewCount = jobs?.filter(j => j.status === 'interview').length || 0







  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      {/* AppHeader removed in favor of Sidebar layout */}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary-600">{jobCount}</div>
                <div className="text-sm text-gray-600 mt-1">{t('totalJobs')}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-neutral-600">{savedCount}</div>
                <div className="text-sm text-gray-600 mt-1">{t('saved')}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-accent-600">{appliedCount}</div>
                <div className="text-sm text-gray-600 mt-1">{t('applied')}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-warning-600">{interviewCount}</div>
                <div className="text-sm text-gray-600 mt-1">{t('interviewing')}</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Bar */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-gray-900">{t('myJobs')}</h2>
          <div className="flex gap-3">
            <Link href="/jobs/import">
              <Button variant="outline">
                🔗 {t('smartImport')}
              </Button>
            </Link>
            <Link href="/jobs/new">
              <Button variant="primary">
                + {t('manualCreate')}
              </Button>
            </Link>
          </div>
        </div>

        {/* Job Board */}
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
                    <Button variant="outline">
                      🔗 {t('smartImport')}
                    </Button>
                  </Link>
                  <Link href="/jobs/new">
                    <Button variant="primary">
                      + {t('manualCreate')}
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="flex gap-6 overflow-x-auto pb-8 -mx-4 px-4 sm:mx-0 sm:px-0">
            {/* Column 1: Saved */}
            <div className="flex-1 min-w-[300px] flex flex-col gap-4">
              <div className="flex items-center justify-between pb-2 border-b-2 border-neutral-200">
                <h3 className="font-semibold text-gray-700">{t('board.saved')}</h3>
                <span className="bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded-full text-xs font-medium">
                  {jobs?.filter(j => j.status === 'saved').length}
                </span>
              </div>
              <div className="flex flex-col gap-4">
                {jobs?.filter(j => j.status === 'saved').map(job => (
                  <JobCard key={job.id} job={job} t={t} />
                ))}
              </div>
            </div>

            {/* Column 2: Applied */}
            <div className="flex-1 min-w-[300px] flex flex-col gap-4">
              <div className="flex items-center justify-between pb-2 border-b-2 border-primary-200">
                <h3 className="font-semibold text-primary-700">{t('board.applied')}</h3>
                <span className="bg-primary-50 text-primary-600 px-2 py-0.5 rounded-full text-xs font-medium">
                  {jobs?.filter(j => j.status === 'applied').length}
                </span>
              </div>
              <div className="flex flex-col gap-4">
                {jobs?.filter(j => j.status === 'applied').map(job => (
                  <JobCard key={job.id} job={job} t={t} />
                ))}
              </div>
            </div>

            {/* Column 3: Interview */}
            <div className="flex-1 min-w-[300px] flex flex-col gap-4">
              <div className="flex items-center justify-between pb-2 border-b-2 border-warning-200">
                <h3 className="font-semibold text-warning-700">{t('board.interview')}</h3>
                <span className="bg-warning-50 text-warning-600 px-2 py-0.5 rounded-full text-xs font-medium">
                  {jobs?.filter(j => j.status === 'interview').length}
                </span>
              </div>
              <div className="flex flex-col gap-4">
                {jobs?.filter(j => j.status === 'interview').map(job => (
                  <JobCard key={job.id} job={job} t={t} />
                ))}
              </div>
            </div>

            {/* Column 4: Archived */}
            <div className="flex-1 min-w-[300px] flex flex-col gap-4">
              <div className="flex items-center justify-between pb-2 border-b-2 border-gray-200">
                <h3 className="font-semibold text-gray-500">{t('board.archived')}</h3>
                <span className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full text-xs font-medium">
                  {jobs?.filter(j => ['rejected', 'offer', 'withdrawn'].includes(j.status)).length}
                </span>
              </div>
              <div className="flex flex-col gap-4">
                {jobs?.filter(j => ['rejected', 'offer', 'withdrawn'].includes(j.status)).map(job => (
                  <JobCard key={job.id} job={job} t={t} />
                ))}
              </div>
            </div>
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
}

interface JobCardProps {
  job: Job
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: any
}

function JobCard({ job, t }: JobCardProps) {
  return (
    <Card className="relative hover:shadow-md transition-shadow bg-white">
      <CardContent className="p-4">
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
