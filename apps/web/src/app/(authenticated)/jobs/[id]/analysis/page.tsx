import { redirect, notFound } from 'next/navigation'
import { getCurrentUser, createClient } from '@/lib/supabase-server'
import Link from 'next/link'
import { Button } from '@careermatch/ui'
import { ArrowLeft, Sparkles } from 'lucide-react'
import { AnalysisV2 } from './components/AnalysisV2'
import { getTranslations } from 'next-intl/server'
import type { AnalysisDimensions } from '@careermatch/shared'

/**
 * 岗位分析页面 - 统一使用V2 8维度分析
 *
 * 基于个人档案的深度分析，提供：
 * - 8维度匹配度评估
 * - CV策略和简历撰写指导
 * - 面试准备建议
 * - SWOT分析
 */
export default async function JobAnalysisPage({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams: { autoStart?: string }
}) {
  const t = await getTranslations('analysis')
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

  // Fetch existing V2 analysis session (with dimensions)
  const { data: session } = await supabase
    .from('analysis_sessions')
    .select('*')
    .eq('job_id', params.id)
    .eq('user_id', user.id)
    .not('dimensions', 'is', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

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

      {/* Main Content - V2 Analysis */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
      </main>
    </div>
  )
}
