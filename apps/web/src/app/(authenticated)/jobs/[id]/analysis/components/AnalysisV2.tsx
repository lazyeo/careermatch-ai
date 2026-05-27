'use client'

import { useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, EmptyState, ProgressBar } from '@careermatch/ui'
import { AlertCircle, Check, Loader2, Palette, RefreshCw, Sparkles } from 'lucide-react'
import { DimensionsDisplay } from './DimensionsDisplay'
import { ScoreCard } from './ScoreCard'
import { MarkdownAnalysis } from './MarkdownAnalysis'
import { TemplateSelector } from './TemplateSelector'
import { StreamingContent } from './StreamingContent'
import type { AnalysisDimensions, AnalysisRecommendation } from '@careermatch/shared'
import type { TemplateRecommendation } from '@/lib/ai/template-recommender'

interface AnalysisV2Props {
  jobId: string
  autoStart?: boolean
  existingSession?: {
    id: string
    score: number
    recommendation: string
    analysis: string
    dimensions?: AnalysisDimensions
    provider: string
    model: string
  } | null
}

type AnalysisState = 'idle' | 'loading' | 'streaming' | 'completed' | 'error'

interface AnalysisResult {
  sessionId: string
  score: number
  recommendation: AnalysisRecommendation
  analysis: string
  dimensions: AnalysisDimensions
  provider: string
  model: string
}

// 流式进度状态
interface StreamProgress {
  progress: number
  status: string
}

/**
 * V2 8维度分析组件
 * 调用 /api/jobs/[id]/analyze-v2 API
 */
export function AnalysisV2({
  jobId,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  autoStart = false,
  existingSession = null,
}: AnalysisV2Props) {
  const router = useRouter()
  const locale = useLocale()
  const t = useTranslations('analysis')
  const abortControllerRef = useRef<AbortController | null>(null)
  const [state, setState] = useState<AnalysisState>(() =>
    existingSession?.dimensions ? 'completed' : 'idle'
  )
  const [result, setResult] = useState<AnalysisResult | null>(() =>
    existingSession?.dimensions
      ? {
          sessionId: existingSession.id,
          score: existingSession.score,
          recommendation: existingSession.recommendation as AnalysisRecommendation,
          analysis: existingSession.analysis,
          dimensions: existingSession.dimensions,
          provider: existingSession.provider,
          model: existingSession.model,
        }
      : null
  )
  const [error, setError] = useState<string | null>(null)
  const [streamProgress, setStreamProgress] = useState<StreamProgress>({ progress: 0, status: t('v2.progress.preparing') })
  const [streamingContent, setStreamingContent] = useState<string>('')
  const [isGeneratingResume, setIsGeneratingResume] = useState(false)
  const [showTemplateSelector, setShowTemplateSelector] = useState(false)
  const [templateRecommendation, setTemplateRecommendation] = useState<TemplateRecommendation | null>(null)

  // 执行V2流式分析
  const startAnalysis = useCallback(async (force = false) => {
    // 取消之前的请求
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    abortControllerRef.current = new AbortController()

    setState('streaming')
    setError(null)
    setStreamProgress({ progress: 0, status: t('v2.connecting') })
    setStreamingContent('')

    try {
      const response = await fetch(`/api/jobs/${jobId}/analyze-v2/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          force,
          locale,
        }),
        signal: abortControllerRef.current.signal,
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.details || data.error || 'Failed to start analysis')
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('Failed to get response stream')
      }

      const decoder = new TextDecoder()
      let buffer = ''

      // 进度阶段映射
      const progressStages = [
        { threshold: 10, status: t('v2.progress.rolePositioning') },
        { threshold: 25, status: t('v2.progress.coreResponsibilities') },
        { threshold: 40, status: t('v2.progress.keywordMatching') },
        { threshold: 55, status: t('v2.progress.keyRequirements') },
        { threshold: 70, status: t('v2.progress.swotAnalysis') },
        { threshold: 85, status: t('v2.progress.cvStrategy') },
        { threshold: 95, status: t('v2.progress.interviewPrep') },
      ]

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))

              if (data.error) {
                throw new Error(data.error)
              }

              if (data.done) {
                // 分析完成
                setResult({
                  sessionId: data.sessionId,
                  score: data.score,
                  recommendation: data.recommendation,
                  analysis: data.analysis,
                  dimensions: data.dimensions,
                  provider: data.provider,
                  model: data.model,
                })
                setState('completed')
                setStreamProgress({ progress: 100, status: t('v2.progress.complete') })
                setStreamingContent('')
                router.refresh()
              } else {
                // 实时更新内容和进度
                if (data.fullContent) {
                  setStreamingContent(data.fullContent)
                }
                if (data.progress !== undefined) {
                  const progress = data.progress
                  const stage = progressStages.find(s => progress < s.threshold) || progressStages[progressStages.length - 1]
                  setStreamProgress({ progress, status: stage.status })
                }
              }
            } catch (parseError) {
              // 忽略解析错误，继续处理
              console.warn('Failed to parse SSE data:', parseError)
            }
          }
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        console.log('Analysis request was cancelled')
        return
      }
      console.error('Analysis error:', err)
      setError(err instanceof Error ? err.message : 'Analysis failed')
      setState('error')
    }
  }, [jobId, router, locale, t])

  // 打开模板选择器
  const openTemplateSelector = async () => {
    if (!result) return

    // 获取模板推荐
    try {
      const response = await fetch(`/api/jobs/${jobId}/analyze-v2`)
      if (response.ok) {
        const data = await response.json()
        if (data.dimensions?.cvStrategy) {
          // 从CV策略推断模板推荐
          const tone = data.dimensions.cvStrategy.tone
          const toneTemplateMap: Record<string, string> = {
            technical: 'tech-engineer',
            executive: 'executive-minimal',
            creative: 'creative-designer',
            conversational: 'modern-blue',
            formal: 'classic-serif',
          }
          const toneLabel = t(`v2.tone.${tone}` as Parameters<typeof t>[0])
          setTemplateRecommendation({
            templateId: toneTemplateMap[tone] || 'modern-blue',
            reason: t('v2.templateRecommendationReason', { tone: toneLabel }),
            confidence: 80,
            alternatives: [],
          } as TemplateRecommendation)
        }
      }
    } catch (err) {
      console.warn('Failed to get template recommendation:', err)
    }

    setShowTemplateSelector(true)
  }

  // 生成简历（带模板选择）
  const generateResume = async (templateId: string) => {
    if (!result?.sessionId) {
      alert(t('v2.sessionIncomplete'))
      return
    }

    setIsGeneratingResume(true)
    try {
      const response = await fetch('/api/resumes/generate-v2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: result.sessionId,
          templateId,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to generate resume')
      }

      const data = await response.json()
      // 关闭模板选择器
      setShowTemplateSelector(false)
      // 跳转到简历预览页面
      window.location.href = `/resumes/preview/${data.resumeId}`
    } catch (err) {
      console.error('Resume generation error:', err)
      alert(err instanceof Error ? err.message : 'Failed to generate resume')
    } finally {
      setIsGeneratingResume(false)
    }
  }

  if (state === 'idle') {
    return (
      <div className="space-y-6">
        <section className="rounded-lg border border-line bg-surface p-6 shadow-xs">
          <div className="flex flex-col gap-4 border-b border-line pb-5 md:flex-row md:items-end md:justify-between">
            <div className="max-w-3xl">
              <p className="cm-eyebrow">{t('v2.workspaceKicker')}</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-normal text-ink">
                {t('v2.workspaceTitle')}
              </h2>
              <p className="mt-2 text-sm leading-6 text-ink-2">
                {t('v2.workspaceDescription')}
              </p>
              <p className="mt-2 text-xs leading-5 text-ink-3">
                {t('v2.outputLanguageNote')}
              </p>
            </div>
            <Button variant="primary" onClick={() => startAnalysis(false)} className="md:min-w-[160px] justify-center gap-2">
              <Sparkles className="h-4 w-4" />
              {t('v2.startButton')}
            </Button>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-4">
            <AnalysisScopeCard
              title={t('v2.scope.decisionTitle')}
              desc={t('v2.scope.decisionDesc')}
            />
            <AnalysisScopeCard
              title={t('v2.scope.evidenceTitle')}
              desc={t('v2.scope.evidenceDesc')}
            />
            <AnalysisScopeCard
              title={t('v2.scope.resumeTitle')}
              desc={t('v2.scope.resumeDesc')}
            />
            <AnalysisScopeCard
              title={t('v2.scope.interviewTitle')}
              desc={t('v2.scope.interviewDesc')}
            />
          </div>
        </section>
      </div>
    )
  }

  // 加载/流式状态
  if (state === 'loading' || state === 'streaming') {
    return (
      <div className="space-y-6">

        {/* 进度状态卡片 */}
        <section className="rounded-lg border border-line bg-surface p-6 shadow-xs">
          <div className="py-2">
            <div className="mb-6 flex items-center gap-4">
              <Loader2 className="h-8 w-8 flex-shrink-0 animate-spin text-brick" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-ink">
                  {t('v2.analyzing')}
                </h3>
                <p className="text-sm text-ink-3">
                  {streamProgress.status}
                </p>
              </div>
              <span className="font-display text-3xl text-brick">
                {streamProgress.progress}%
              </span>
            </div>

            <ProgressBar value={Math.max(2, streamProgress.progress)} size="thick" className="mb-6" />

            {/* 分析阶段指示 */}
            <div className="grid grid-cols-2 gap-2 text-xs md:grid-cols-4">
              <ProgressStep
                label={t('v2.steps.rolePositioning')}
                active={streamProgress.progress >= 0 && streamProgress.progress < 25}
                completed={streamProgress.progress >= 25}
              />
              <ProgressStep
                label={t('v2.steps.keywordMatching')}
                active={streamProgress.progress >= 25 && streamProgress.progress < 50}
                completed={streamProgress.progress >= 50}
              />
              <ProgressStep
                label={t('v2.steps.swotAnalysis')}
                active={streamProgress.progress >= 50 && streamProgress.progress < 75}
                completed={streamProgress.progress >= 75}
              />
              <ProgressStep
                label={t('v2.steps.cvStrategy')}
                active={streamProgress.progress >= 75 && streamProgress.progress < 100}
                completed={streamProgress.progress >= 100}
              />
            </div>
          </div>
        </section>

        {/* 实时解析内容显示 */}
        {streamingContent && (
          <StreamingContent content={streamingContent} />
        )}
      </div>
    )
  }

  // 错误状态
  if (state === 'error') {
    return (
      <div className="space-y-6">

        <Card>
          <CardContent className="py-12">
            <EmptyState
              icon={<AlertCircle className="h-5 w-5" />}
              title={t('v2.error')}
              description={error || undefined}
              action={
              <Button
                variant="primary"
                onClick={() => startAnalysis(true)}
              >
                {t('v2.retry')}
              </Button>
              }
            />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-line bg-surface p-6 shadow-xs">
        <div className="flex flex-col gap-4 border-b border-line pb-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="cm-eyebrow">{t('v2.resultKicker')}</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-normal text-ink">
              {t('v2.resultTitle')}
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-ink-2">
              {t('v2.resultDescription')}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge tone="indigo">
              <Sparkles className="h-3 w-3" />
              {t('v2.badge')}
            </Badge>
            <span className="text-xs text-ink-3">
              {t('v2.providedBy')} {result?.provider?.toUpperCase()} · {result?.model}
            </span>
          </div>
        </div>

        {result && (
          <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
            <div className="space-y-6">
              <ScoreCard
                score={result.score}
                recommendation={result.recommendation}
              />

              {result?.analysis && (
                <Card variant="inset">
                  <CardHeader>
                    <CardTitle className="text-base">
                      {t('v2.conclusionTitle')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <MarkdownAnalysis content={result.analysis} />
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="space-y-4">
              <Card variant="inset">
                <CardContent className="space-y-4 p-5">
                  <div>
                    <h3 className="text-base font-semibold text-ink">{t('v2.nextActionsTitle')}</h3>
                    <p className="mt-1 text-sm text-ink-3">
                      {t('v2.nextActionsDescription')}
                    </p>
                  </div>
                  <Button
                    variant="secondary"
                    onClick={() => startAnalysis(true)}
                    className="w-full justify-center gap-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    {t('v2.reAnalyze')}
                  </Button>
                  <Button
                    variant="primary"
                    onClick={openTemplateSelector}
                    className="w-full justify-center gap-2"
                    disabled={!result?.sessionId || !result?.dimensions}
                  >
                    <Palette className="h-4 w-4" />
                    {t('v2.selectTemplateAndGenerate')}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </section>

      {result?.dimensions && (
        <DimensionsDisplay dimensions={result.dimensions} />
      )}

      <TemplateSelector
        isOpen={showTemplateSelector}
        onClose={() => setShowTemplateSelector(false)}
        onSelect={generateResume}
        recommendation={templateRecommendation}
        isLoading={isGeneratingResume}
      />
    </div>
  )
}

function AnalysisScopeCard({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="min-h-[132px] rounded-lg border border-line bg-surface-2 p-4">
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-ink-2">{desc}</p>
    </div>
  )
}

// 进度步骤指示器
function ProgressStep({
  label,
  active,
  completed,
}: {
  label: string
  active: boolean
  completed: boolean
}) {
  return (
    <div className="flex flex-col items-center">
      <div
      className={`mb-1 flex h-6 w-6 items-center justify-center rounded-full transition-colors ${
          completed
            ? 'bg-sage text-white'
            : active
              ? 'animate-pulse bg-brick text-white'
              : 'bg-surface-3 text-ink-4'
        }`}
      >
        {completed ? (
          <Check className="h-3 w-3" />
        ) : (
          <span className="text-xs">{active ? '•' : ''}</span>
        )}
      </div>
      <span
        className={`text-center ${
          completed ? 'text-sage' : active ? 'font-medium text-brick' : 'text-ink-4'
        }`}
      >
        {label}
      </span>
    </div>
  )
}
