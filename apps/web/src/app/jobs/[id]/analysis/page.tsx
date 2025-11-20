import { redirect, notFound } from 'next/navigation'
import { getCurrentUser, createClient } from '@/lib/supabase-server'
import Link from 'next/link'
import { Button, Card, CardContent, CardHeader, CardTitle } from '@careermatch/ui'
import { ArrowLeft, FileText, Sparkles } from 'lucide-react'
import { RadarChartComponent } from './components/RadarChartComponent'
import { MatchScoreCard } from './components/MatchScoreCard'
import { StrengthsGapsSection } from './components/StrengthsGapsSection'
import { SWOTMatrix } from './components/SWOTMatrix'
import { KeywordsTable } from './components/KeywordsTable'
import { AnalyzeButton } from './components/AnalyzeButton'
import { ResumeSelector } from './components/ResumeSelector'

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
    .select('id, full_name, created_at, updated_at')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })

  // Fetch existing analysis if resumeId is provided
  let analysis = null
  if (searchParams.resumeId) {
    const { data } = await supabase
      .from('job_analyses')
      .select('*')
      .eq('job_id', params.id)
      .eq('resume_id', searchParams.resumeId)
      .single()

    analysis = data
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
                <h1 className="text-xl font-bold text-gray-900">AI匹配分析</h1>
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
                选择一份简历，AI将分析其与该岗位的匹配度
              </p>
              <ResumeSelector resumes={resumes || []} jobId={params.id} />
            </CardContent>
          </Card>
        ) : !analysis ? (
          /* Start analysis */
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <Sparkles className="w-12 h-12 text-primary-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  准备开始分析
                </h3>
                <p className="text-sm text-gray-600 mb-6 max-w-md mx-auto">
                  点击下方按钮，AI将深度分析您的简历与该岗位的匹配度，
                  包括9维度分析、SWOT分析和关键词匹配
                </p>
                <AnalyzeButton jobId={params.id} resumeId={searchParams.resumeId} />
                <p className="text-xs text-gray-500 mt-4">
                  ⏱️ 分析通常需要15-30秒
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          /* Show analysis results */
          <div className="space-y-6">
            {/* Match Score */}
            <MatchScoreCard score={analysis.match_score} />

            {/* 9 Dimensions Radar Chart */}
            <Card>
              <CardHeader>
                <CardTitle>9维度匹配分析</CardTitle>
              </CardHeader>
              <CardContent>
                <RadarChartComponent dimensions={analysis.dimensions} />

                {/* Dimension Details */}
                <div className="mt-6 grid md:grid-cols-3 gap-4">
                  {analysis.dimensions.map((dim: { name: string; score: number; description: string }, index: number) => (
                    <div key={index} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-semibold text-gray-900">{dim.name}</h4>
                        <span className="text-lg font-bold text-primary-600">{dim.score}</span>
                      </div>
                      <p className="text-xs text-gray-600">{dim.description}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Strengths and Gaps */}
            <StrengthsGapsSection
              strengths={analysis.strengths}
              gaps={analysis.gaps}
            />

            {/* SWOT Analysis */}
            <Card>
              <CardHeader>
                <CardTitle>SWOT 分析</CardTitle>
              </CardHeader>
              <CardContent>
                <SWOTMatrix swot={analysis.swot} />
              </CardContent>
            </Card>

            {/* Keywords Matching */}
            <KeywordsTable keywords={analysis.keywords} />

            {/* Actions */}
            <div className="flex gap-3 justify-end">
              <AnalyzeButton
                jobId={params.id}
                resumeId={searchParams.resumeId}
                label="重新分析"
              />
              <Link href={`/resumes/${searchParams.resumeId}/edit`}>
                <Button variant="primary">优化简历</Button>
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
