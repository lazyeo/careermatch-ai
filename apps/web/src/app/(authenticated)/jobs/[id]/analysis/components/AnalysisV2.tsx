'use client'

import { useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Card, CardContent, CardHeader, CardTitle } from '@careermatch/ui'
import { Sparkles, Loader2, User, FileText, Zap, RefreshCw, Palette } from 'lucide-react'
import { AIProviderSelector, type AIProviderType } from './AIProviderSelector'
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
  const abortControllerRef = useRef<AbortController | null>(null)
  const [selectedProvider, setSelectedProvider] = useState<AIProviderType | undefined>(undefined)
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
  const [streamProgress, setStreamProgress] = useState<StreamProgress>({ progress: 0, status: '准备中...' })
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
    setStreamProgress({ progress: 0, status: '正在连接AI服务...' })
    setStreamingContent('')

    try {
      const response = await fetch(`/api/jobs/${jobId}/analyze-v2/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: selectedProvider,
          force,
        }),
        signal: abortControllerRef.current.signal,
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to start analysis')
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('Failed to get response stream')
      }

      const decoder = new TextDecoder()
      let buffer = ''

      // 进度阶段映射
      const progressStages = [
        { threshold: 10, status: '正在分析角色定位...' },
        { threshold: 25, status: '正在匹配核心职责...' },
        { threshold: 40, status: '正在分析关键词匹配度...' },
        { threshold: 55, status: '正在评估关键要求...' },
        { threshold: 70, status: '正在进行SWOT分析...' },
        { threshold: 85, status: '正在生成CV策略...' },
        { threshold: 95, status: '正在准备面试建议...' },
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
                setStreamProgress({ progress: 100, status: '分析完成!' })
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
  }, [jobId, selectedProvider, router])

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
    if (!result) return

    setIsGeneratingResume(true)
    try {
      const response = await fetch('/api/resumes/generate-v2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: result.sessionId,
          provider: selectedProvider,
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

  // 初始状态
  if (state === 'idle') {
    return (
      <div className="space-y-6">
        <AIProviderSelector
          selectedProvider={selectedProvider}
          onSelect={setSelectedProvider}
        />

        <Card>
          <CardContent className="py-8">
            <div className="text-center mb-8">
              <div className="relative w-16 h-16 mx-auto mb-4">
                <User className="w-16 h-16 text-indigo-200" />
                <Sparkles className="w-6 h-6 text-indigo-600 absolute -right-1 -bottom-1" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                8维度智能分析
              </h3>
              <p className="text-sm text-gray-600 max-w-md mx-auto">
                基于AI的深度8维度分析，提供详细的CV策略、面试准备建议和匹配度评估
              </p>
            </div>

            {/* 功能亮点 */}
            <div className="grid md:grid-cols-4 gap-4 max-w-3xl mx-auto mb-8">
              <FeatureItem
                icon={<Zap className="w-5 h-5" />}
                title="CV策略"
                desc="智能简历撰写指导"
              />
              <FeatureItem
                icon={<FileText className="w-5 h-5" />}
                title="关键词匹配"
                desc="ATS优化建议"
              />
              <FeatureItem
                icon={<User className="w-5 h-5" />}
                title="SWOT分析"
                desc="全面优劣势评估"
              />
              <FeatureItem
                icon={<Sparkles className="w-5 h-5" />}
                title="面试准备"
                desc="预测问题与回答"
              />
            </div>

            {/* 开始按钮 */}
            <div className="text-center">
              <Button
                variant="primary"
                onClick={() => startAnalysis(false)}
                className="gap-2"
              >
                <Sparkles className="w-4 h-4" />
                开始8维度分析
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // 加载/流式状态
  if (state === 'loading' || state === 'streaming') {
    return (
      <div className="space-y-6">
        <AIProviderSelector
          selectedProvider={selectedProvider}
          onSelect={setSelectedProvider}
        />

        {/* 进度状态卡片 */}
        <Card>
          <CardContent className="py-8">
            <div className="flex items-center gap-4 mb-6">
              <Loader2 className="w-8 h-8 text-primary-600 animate-spin flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">
                  AI正在进行8维度深度分析...
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
                label="角色定位"
                active={streamProgress.progress >= 0 && streamProgress.progress < 25}
                completed={streamProgress.progress >= 25}
              />
              <ProgressStep
                label="关键词匹配"
                active={streamProgress.progress >= 25 && streamProgress.progress < 50}
                completed={streamProgress.progress >= 50}
              />
              <ProgressStep
                label="SWOT分析"
                active={streamProgress.progress >= 50 && streamProgress.progress < 75}
                completed={streamProgress.progress >= 75}
              />
              <ProgressStep
                label="CV策略"
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
        <AIProviderSelector
          selectedProvider={selectedProvider}
          onSelect={setSelectedProvider}
        />

        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">!</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                分析失败
              </h3>
              <p className="text-sm text-gray-600 mb-4">{error}</p>
              <Button
                variant="primary"
                onClick={() => startAnalysis(true)}
              >
                重试
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // 完成状态
  return (
    <div className="space-y-6">
      <AIProviderSelector
        selectedProvider={selectedProvider}
        onSelect={setSelectedProvider}
      />

      {/* 分析类型标识 */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-medium">
            <Zap className="w-3 h-3" />
            8维度智能分析 V2
          </span>
          <span className="text-xs text-gray-500">
            由 {result?.provider?.toUpperCase()} 提供 · {result?.model}
          </span>
        </div>
      </div>

      {/* 评分卡 */}
      {result && (
        <ScoreCard
          score={result.score}
          recommendation={result.recommendation}
        />
      )}

      {/* 8维度分析展示 */}
      {result?.dimensions && (
        <DimensionsDisplay dimensions={result.dimensions} />
      )}

      {/* 原始分析文本（折叠） */}
      {result?.analysis && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              详细分析报告
            </CardTitle>
          </CardHeader>
          <CardContent>
            <MarkdownAnalysis content={result.analysis} />
          </CardContent>
        </Card>
      )}

      {/* 操作按钮 */}
      <div className="flex gap-3 justify-end">
        <Button
          variant="outline"
          onClick={() => startAnalysis(true)}
          className="gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          重新分析
        </Button>
        <Button
          variant="primary"
          onClick={openTemplateSelector}
          className="gap-2"
        >
          <Palette className="w-4 h-4" />
          选择模板并生成简历
        </Button>
      </div>

      {/* 模板选择器 */}
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

// 功能亮点项
function FeatureItem({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode
  title: string
  desc: string
}) {
  return (
    <div className="text-center p-3">
      <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-2">
        {icon}
      </div>
      <h4 className="text-sm font-medium text-gray-900">{title}</h4>
      <p className="text-xs text-gray-500 mt-1">{desc}</p>
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
