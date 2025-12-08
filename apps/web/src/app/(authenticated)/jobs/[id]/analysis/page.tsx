import { redirect, notFound } from 'next/navigation'
import { getCurrentUser, createClient } from '@/lib/supabase-server'
import Link from 'next/link'
import { Button, Card, CardContent, CardHeader, CardTitle } from '@careermatch/ui'
import { ArrowLeft, FileText, Sparkles, User, Zap } from 'lucide-react'
import { ResumeSelector } from './components/ResumeSelector'
import { AnalysisInterface } from './components/AnalysisInterface'
import { AnalysisResultsView } from './components/AnalysisResultsView'
import { ProfileAnalysisInterface } from './components/ProfileAnalysisInterface'
import { AnalysisV2 } from './components/AnalysisV2'
import { getTranslations } from 'next-intl/server'
import type { AnalysisDimensions } from '@careermatch/shared'

export default async function JobAnalysisPage({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams: { resumeId?: string; mode?: 'profile' | 'resume' | 'v2'; autoStart?: string }
}) {
  const t = await getTranslations('analysis')
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _tCommon = await getTranslations('common')
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login?redirect=/jobs/' + params.id + '/analysis')
  }

  const supabase = await createClient()

  // Fetch the job
  const { data: job, error: jobError } = await supabase
    .from('jobs')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()

  if (jobError || !job) {
    notFound()
  }

  // Fetch user's resumes for selection
  const { data: resumes } = await supabase
    .from('resumes')
    .select('id, title, created_at, updated_at')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })

  // Fetch existing analysis session
  let session = null
  let messages: Array<{ id: string; role: string; content: string; created_at: string }> = []

  if (searchParams.resumeId) {
    // Resume-based analysis session
    const { data: sessionData } = await supabase
      .from('analysis_sessions')
      .select('*')
      .eq('job_id', params.id)
      .eq('resume_id', searchParams.resumeId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (sessionData) {
      session = sessionData

      // Fetch messages for this session
      const { data: messagesData } = await supabase
        .from('analysis_messages')
        .select('*')
        .eq('session_id', session.id)
        .order('created_at', { ascending: true })

      messages = messagesData || []
    }
  } else if (searchParams.mode === 'profile') {
    // Profile-based analysis session (resume_id is null)
    const { data: sessionData } = await supabase
      .from('analysis_sessions')
      .select('*')
      .eq('job_id', params.id)
      .is('resume_id', null)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (sessionData) {
      session = sessionData
    }
  } else if (searchParams.mode === 'v2') {
    // V2 8-dimension analysis session (has dimensions field)
    const { data: sessionData } = await supabase
      .from('analysis_sessions')
      .select('*')
      .eq('job_id', params.id)
      .not('dimensions', 'is', null)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (sessionData) {
      session = sessionData
    }
  }

  const hasResumes = !!(resumes && resumes.length > 0)
  const isProfileMode = searchParams.mode === 'profile' || !hasResumes
  const isV2Mode = searchParams.mode === 'v2'
  const autoStart = searchParams.autoStart === 'true'

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Link href={`/jobs/${params.id}`}>
              <Button variant="ghost" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                {t('backToJob')}
              </Button>
            </Link>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary-600" />
                <h1 className="text-xl font-bold text-gray-900">{t('title')}</h1>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                {t('jobAt', { title: job.title, company: job.company })}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isV2Mode ? (
          /* V2 8-dimension analysis */
          <AnalysisV2
            jobId={params.id}
            autoStart={autoStart}
            existingSession={session ? {
              id: session.id,
              score: session.score,
              recommendation: session.recommendation,
              analysis: session.analysis,
              dimensions: session.dimensions as AnalysisDimensions | undefined,
              provider: session.provider,
              model: session.model,
            } : null}
          />
        ) : isProfileMode && !searchParams.resumeId ? (
          /* Profile-based analysis (no resume needed) */
          <ProfileAnalysisInterface
            jobId={params.id}
            hasResumes={hasResumes}
            autoStart={autoStart}
            existingSession={session}
          />
        ) : !searchParams.resumeId ? (
          /* Resume selection - with profile option */
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('selectMethod')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-6">
                  {t('selectMethodDesc')}
                </p>

                {/* Analysis Mode Options */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  {/* V2 8-dimension Option - NEW & Recommended */}
                  <Link href={`/jobs/${params.id}/analysis?mode=v2`}>
                    <div className="border-2 border-indigo-300 rounded-lg p-4 hover:border-indigo-400 hover:bg-indigo-50/50 transition-colors cursor-pointer h-full relative">
                      <span className="absolute -top-2 right-2 px-2 py-0.5 bg-indigo-600 text-white text-xs rounded-full">
                        推荐
                      </span>
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
                          <Zap className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">8维度智能分析</h4>
                          <p className="text-sm text-gray-500 mt-1">
                            深度8维度分析，包含CV策略、面试准备、SWOT分析等
                          </p>
                        </div>
                      </div>
                    </div>
                  </Link>

                  {/* Profile-based Option */}
                  <Link href={`/jobs/${params.id}/analysis?mode=profile`}>
                    <div className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:bg-blue-50/50 transition-colors cursor-pointer h-full">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                          <User className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{t('profileAnalysis')}</h4>
                          <p className="text-sm text-gray-500 mt-1">
                            {t('profileAnalysisDesc')}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Link>

                  {/* Resume-based Option */}
                  <div className="border border-gray-200 rounded-lg p-4 hover:border-primary-300 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-5 h-5 text-primary-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{t('resumeMatching')}</h4>
                        <p className="text-sm text-gray-500 mt-1">
                          {t('resumeMatchingDesc')}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-4">{t('selectResume')}</h4>
                  <ResumeSelector resumes={resumes || []} jobId={params.id} />
                </div>
              </CardContent>
            </Card>
          </div>
        ) : !session ? (
          /* Start analysis - with AI provider selection */
          <AnalysisInterface jobId={params.id} resumeId={searchParams.resumeId} />
        ) : (
          /* Show analysis results - with option to re-analyze using streaming */
          <AnalysisResultsView
            session={session}
            messages={messages}
            jobId={params.id}
            resumeId={searchParams.resumeId}
          />
        )}
      </main>
    </div>
  )
}
