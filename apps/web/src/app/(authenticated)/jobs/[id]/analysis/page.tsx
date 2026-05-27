import { redirect, notFound } from 'next/navigation'
import { getCurrentUser, createClient } from '@/lib/supabase-server'
import Link from 'next/link'
import { Button } from '@careermatch/ui'
import { ArrowLeft } from 'lucide-react'
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
    <div className="space-y-6">
      <section className="rounded-lg border border-line bg-surface p-6 shadow-xs">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="min-w-0 max-w-3xl">
              <Link href={`/jobs/${params.id}`}>
                <Button variant="ghost" className="mb-3 gap-2 px-0 text-ink-3 hover:text-ink">
                  <ArrowLeft className="h-4 w-4" />
                  {t('backToJob')}
                </Button>
              </Link>
              <p className="cm-eyebrow">{t('v2.pageHeaderKicker')}</p>
              <h1 className="mt-2 font-display text-4xl leading-tight text-ink sm:text-5xl">{t('title')}</h1>
              <p className="mt-2 text-sm leading-6 text-ink-2">
                {t('jobAt', { title: job.title, company: job.company })}
              </p>
            </div>
            <div className="max-w-sm text-sm leading-6 text-ink-3">
              {t('v2.pageHeaderNote')}
            </div>
          </div>
      </section>

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
    </div>
  )
}
