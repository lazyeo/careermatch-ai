import { redirect, notFound } from 'next/navigation'
import { getCurrentUser, createClient } from '@/lib/supabase-server'
import Link from 'next/link'
import { Button, Card, CardContent, CardHeader, CardTitle } from '@careermatch/ui'
import { ArrowLeft, FileText, Sparkles } from 'lucide-react'
import { ResumeSelector } from './components/ResumeSelector'
import { AnalysisInterface } from './components/AnalysisInterface'
import { AnalysisResultsView } from './components/AnalysisResultsView'

export default async function JobAnalysisPage({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams: { resumeId?: string }
}) {
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

  // Fetch existing analysis session if resumeId is provided
  let session = null
  let messages: Array<{ id: string; role: string; content: string; created_at: string }> = []

  if (searchParams.resumeId) {
    // Try new analysis_sessions table first
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
  }

  const hasResumes = resumes && resumes.length > 0

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Link href={`/jobs/${params.id}`}>
              <Button variant="ghost" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                返回岗位详情
              </Button>
            </Link>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary-600" />
                <h1 className="text-xl font-bold text-gray-900">AI智能分析</h1>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                {job.title} @ {job.company}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!hasResumes ? (
          /* No resumes - prompt to create */
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  还没有简历
                </h3>
                <p className="text-sm text-gray-600 mb-6">
                  请先创建一份简历，然后再进行AI匹配分析
                </p>
                <Link href="/resumes/new">
                  <Button variant="primary">创建简历</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : !searchParams.resumeId ? (
          /* Resume selection */
          <Card>
            <CardHeader>
              <CardTitle>选择简历进行分析</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-6">
                选择一份简历，AI将对其与该岗位的匹配度进行深度分析
              </p>
              <ResumeSelector resumes={resumes || []} jobId={params.id} />
            </CardContent>
          </Card>
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
