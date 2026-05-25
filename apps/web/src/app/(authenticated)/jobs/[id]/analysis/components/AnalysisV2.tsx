'use client'

import { useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { Button, Card, CardContent, CardHeader, CardTitle } from '@careermatch/ui'
import { Sparkles, Loader2, RefreshCw, Palette } from 'lucide-react'
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
          setTemplateRecommendation({
            templateId: toneTemplateMap[tone] || 'modern-blue',
            reason: `基于CV策略分析，推荐使用${tone === 'technical' ? '技术' : tone === 'executive' ? '高管' : tone === 'creative' ? '创意' : tone === 'conversational' ? '现代' : '经典'}风格模板`,
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
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 border-b border-gray-100 pb-5 md:flex-row md:items-end md:justify-between">
            <div className="max-w-3xl">
              <p className="text-sm font-medium text-gray-500">Analysis workspace</p>
              <h2 className="mt-1 text-2xl font-semibold tracking-tight text-gray-950">
                深度分析只回答一件事：这份岗位为什么值得继续投入
              </h2>
              <p className="mt-2 text-sm leading-6 text-gray-600">
                详情页里的岗位点评负责快速判断；这里负责完整证据链，包括匹配分、关键要求、风险、简历策略和面试准备。
              </p>
            </div>
            <Button variant="primary" onClick={() => startAnalysis(false)} className="md:min-w-[160px] justify-center gap-2">
              <Sparkles className="w-4 h-4" />
              {t('v2.startButton')}
            </Button>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-4">
            <AnalysisScopeCard
              title="快速判断"
              desc="先给出匹配度和推荐等级，帮助你决定是否继续。"
            />
            <AnalysisScopeCard
              title="证据拆解"
              desc="把岗位要求、关键词和主要风险拆开，而不是只给一句总结。"
            />
            <AnalysisScopeCard
              title="材料策略"
              desc="给出简历改写重点和模板方向，减少后续反复试错。"
            />
            <AnalysisScopeCard
              title="面试准备"
              desc="把后续准备动作留在同一页，不再分散到多个工具面板。"
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
        <Card>
          <CardContent className="py-8">
            <div className="flex items-center gap-4 mb-6">
              <Loader2 className="w-8 h-8 text-primary-600 animate-spin flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">
                  {t('v2.analyzing')}
                </h3>
                <p className="text-sm text-gray-500">
                  {streamProgress.status}
                </p>
              </div>
              <span className="text-2xl font-bold text-indigo-600">
                {streamProgress.progress}%
              </span>
            </div>

            {/* 进度条 */}
            <div className="mb-6">
              <div className="bg-gray-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${Math.max(2, streamProgress.progress)}%` }}
                />
              </div>
            </div>

            {/* 分析阶段指示 */}
            <div className="grid grid-cols-4 gap-2 text-xs">
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
          </CardContent>
        </Card>

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
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">!</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {t('v2.error')}
              </h3>
              <p className="text-sm text-gray-600 mb-4">{error}</p>
              <Button
                variant="primary"
                onClick={() => startAnalysis(true)}
              >
                {t('v2.retry')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 border-b border-gray-100 pb-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Analysis result</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight text-gray-950">
              详细分析负责证据链，岗位点评只负责快速摘要
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600">
              如果你已经在详情页看过岗位点评，这里应该继续向下回答：分数从哪里来、主要短板是什么、简历和面试要怎么调整。
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
              <Sparkles className="h-3 w-3" />
              {t('v2.badge')}
            </span>
            <span className="text-xs text-gray-500">
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
                <Card className="border-gray-200 shadow-none">
                  <CardHeader>
                    <CardTitle className="text-base">
                      结论与建议
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <MarkdownAnalysis content={result.analysis} />
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="space-y-4">
              <Card className="border-gray-200 shadow-none">
                <CardContent className="space-y-4 p-5">
                  <div>
                    <h3 className="text-base font-semibold text-gray-900">后续动作</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      当岗位值得继续时，再进入模板选择和简历生成，不让生成动作提前抢占判断过程。
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => startAnalysis(true)}
                    className="w-full justify-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    {t('v2.reAnalyze')}
                  </Button>
                  <Button
                    variant="primary"
                    onClick={openTemplateSelector}
                    className="w-full justify-center gap-2"
                    disabled={!result?.sessionId || !result?.dimensions}
                  >
                    <Palette className="w-4 h-4" />
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
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
      <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-gray-600">{desc}</p>
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
        className={`w-6 h-6 rounded-full flex items-center justify-center mb-1 transition-colors ${
          completed
            ? 'bg-green-500 text-white'
            : active
              ? 'bg-indigo-500 text-white animate-pulse'
              : 'bg-gray-200 text-gray-400'
        }`}
      >
        {completed ? (
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <span className="text-xs">{active ? '•' : ''}</span>
        )}
      </div>
      <span
        className={`text-center ${
          completed ? 'text-green-600' : active ? 'text-indigo-600 font-medium' : 'text-gray-400'
        }`}
      >
        {label}
      </span>
    </div>
  )
}
