import { redirect, notFound } from 'next/navigation'
import { getCurrentUser, createClient } from '@/lib/supabase-server'
import Link from 'next/link'
import { Button, Card, CardContent, CardHeader, CardTitle } from '@careermatch/ui'
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

  // Fetch related analysis sessions, resumes, and cover letters
  const [analysisResult, resumesResult, coverLettersResult] = await Promise.all([
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
  ])

  const latestAnalysis = analysisResult.data?.[0]
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

  // Clean source URL
  const sourceUrl = job.source_url?.split(/[\n,]/)[0]?.trim() || job.source_url

  // Construct Original Content
  const originalContent = job.original_content || [
    job.description,
    job.requirements,
    job.benefits
  ].filter(Boolean).join('\n\n---\n\n') || t('noContent')

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900">{job.title}</h1>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(job.status)}`}>
                  {getStatusLabel(job.status)}
                </span>
              </div>
              <p className="text-lg text-gray-600 mt-1">{job.company}</p>
              <p className="text-sm text-gray-500 mt-1">
                {t('updatedAt')} {new Date(job.updated_at).toLocaleDateString(locale)}
              </p>
            </div>
            <div className="flex gap-2">
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
          details={
            <div className="space-y-6">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle>{t('basicInfo')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm font-medium text-gray-500">{t('jobTitle')}</span>
                      <p className="mt-1 text-gray-900">{job.title}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">{t('companyName')}</span>
                      <p className="mt-1 text-gray-900">{job.company}</p>
                    </div>
                    {job.location && (
                      <div>
                        <span className="text-sm font-medium text-gray-500">{t('location')}</span>
                        <p className="mt-1 text-gray-900">{job.location}</p>
                      </div>
                    )}
                    {job.job_type && (
                      <div>
                        <span className="text-sm font-medium text-gray-500">{t('jobType')}</span>
                        <p className="mt-1 text-gray-900">{getJobTypeLabel(job.job_type)}</p>
                      </div>
                    )}
                    {(job.salary_min || job.salary_max) && (
                      <div>
                        <span className="text-sm font-medium text-gray-500">{t('salaryRange')}</span>
                        <p className="mt-1 text-gray-900">
                          {job.salary_currency} {job.salary_min?.toLocaleString() || '0'}
                          {job.salary_max ? ` - ${job.salary_max.toLocaleString()}` : '+'}
                        </p>
                      </div>
                    )}
                    {sourceUrl && (
                      <div className="col-span-2">
                        <span className="text-sm font-medium text-gray-500">{t('sourceUrl')}</span>
                        <p className="mt-1">
                          <a
                            href={sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary-600 hover:underline break-all"
                          >
                            {sourceUrl}
                          </a>
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Job Description */}
              {job.description && (
                <Card>
                  <CardHeader>
                    <CardTitle>{t('description')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
                      {job.description}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Requirements */}
              {job.requirements && (
                <Card>
                  <CardHeader>
                    <CardTitle>{t('requirements')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
                      {job.requirements}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Benefits */}
              {job.benefits && (
                <Card>
                  <CardHeader>
                    <CardTitle>{t('benefits')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
                      {job.benefits}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Timeline */}
              {(job.posted_date || job.deadline) && (
                <Card>
                  <CardHeader>
                    <CardTitle>{t('timeInfo')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      {job.posted_date && (
                        <div>
                          <span className="text-sm font-medium text-gray-500">{t('postedDate')}</span>
                          <p className="mt-1 text-gray-900">
                            {new Date(job.posted_date).toLocaleDateString(locale)}
                          </p>
                        </div>
                      )}
                      {job.deadline && (
                        <div>
                          <span className="text-sm font-medium text-gray-500">{t('deadline')}</span>
                          <p className="mt-1 text-gray-900">
                            {new Date(job.deadline).toLocaleDateString(locale)}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          }
          original={originalContent}
          analysis={
            <div className="space-y-6">
              {/* Job Summary / Critique */}
              <JobSummary jobId={params.id} />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Apply for Job */}
                <div className="md:col-span-2">
                  <ApplyJobButton jobId={params.id} />
                </div>

                {/* AI Match Analysis */}
                <Card className="bg-gradient-to-br from-primary-50 to-accent-50 border-primary-200">
                  <CardContent className="py-12">
                    <div className="text-center">
                      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary-100 mb-4">
                        <svg className="w-6 h-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {t('aiMatchAnalysis')}
                      </h3>
                      {latestAnalysis ? (
                        <>
                          <div className="mb-4">
                            <div className="text-3xl font-bold text-primary-600 mb-1">
                              {latestAnalysis.score}/100
                            </div>
                            <div className="text-xs text-gray-500">
                              {new Date(latestAnalysis.created_at).toLocaleDateString(locale)}
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 max-w-md mx-auto mb-6">
                            已分析完成，查看详细报告
                          </p>
                          <Link href={`/jobs/${params.id}/analysis?mode=profile`}>
                            <Button variant="primary" className="gap-2">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              查看分析
                            </Button>
                          </Link>
                        </>
                      ) : (
                        <>
                          <p className="text-sm text-gray-600 max-w-md mx-auto mb-6">
                            {t('aiMatchAnalysisDesc')}
                          </p>
                          <Link href={`/jobs/${params.id}/analysis`}>
                            <Button variant="primary" className="gap-2">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                              </svg>
                              {t('startAnalysis')}
                            </Button>
                          </Link>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* AI Cover Letter */}
                <Card className="bg-gradient-to-br from-accent-50 to-success-50 border-accent-200">
                  <CardContent className="py-12">
                    <div className="text-center">
                      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-accent-100 mb-4">
                        <svg className="w-6 h-6 text-accent-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {t('aiCoverLetter')}
                      </h3>
                      <p className="text-sm text-gray-600 max-w-md mx-auto mb-6">
                        {t('aiCoverLetterDesc')}
                      </p>
                      <Link href={`/jobs/${params.id}/cover-letter`}>
                        <Button variant="primary" className="gap-2">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          {t('generateCoverLetter')}
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          }
        />

        {/* Generated Documents Section */}
        {(resumes.length > 0 || coverLetters.length > 0) && (
          <Card>
            <CardHeader>
              <CardTitle>已生成的求职材料</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Resumes */}
              {resumes.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    简历 ({resumes.length})
                  </h4>
                  <div className="space-y-2">
                    {resumes.map((resume) => (
                      <Link
                        key={resume.id}
                        href={`/resumes/preview/${resume.id}`}
                        className="block p-3 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50/50 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">{resume.title}</div>
                            <div className="text-sm text-gray-500 mt-1">
                              {new Date(resume.created_at).toLocaleDateString(locale)} · {' '}
                              {resume.source === 'ai_generated' ? 'AI生成' : '手动创建'}
                            </div>
                          </div>
                          <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Cover Letters */}
              {coverLetters.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    求职信 ({coverLetters.length})
                  </h4>
                  <div className="space-y-2">
                    {coverLetters.map((letter) => (
                      <div
                        key={letter.id}
                        className="block p-3 border border-gray-200 rounded-lg"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">{letter.title}</div>
                            <div className="text-sm text-gray-500 mt-1">
                              {new Date(letter.created_at).toLocaleDateString(locale)} · {' '}
                              {letter.source === 'ai_generated' ? 'AI生成' : '手动创建'}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
