'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Card, CardContent, CardHeader, CardTitle } from '@careermatch/ui'
import { Sparkles, Loader2, User, FileText, Zap, RefreshCw } from 'lucide-react'
import { AIProviderSelector, type AIProviderType } from './AIProviderSelector'
import { DimensionsDisplay } from './DimensionsDisplay'
import { ScoreCard } from './ScoreCard'
import { MarkdownAnalysis } from './MarkdownAnalysis'
import type { AnalysisDimensions, AnalysisRecommendation } from '@careermatch/shared'

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

type AnalysisState = 'idle' | 'loading' | 'completed' | 'error'

interface AnalysisResult {
  sessionId: string
  score: number
  recommendation: AnalysisRecommendation
  analysis: string
  dimensions: AnalysisDimensions
  provider: string
  model: string
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
  const [isGeneratingResume, setIsGeneratingResume] = useState(false)

  // 执行V2分析
  const startAnalysis = useCallback(async (force = false) => {
    setState('loading')
    setError(null)

    try {
      const response = await fetch(`/api/jobs/${jobId}/analyze-v2`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: selectedProvider,
          force,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to analyze')
      }

      const data = await response.json()
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

      // 通知页面刷新
      router.refresh()
    } catch (err) {
      console.error('Analysis error:', err)
      setError(err instanceof Error ? err.message : 'Analysis failed')
      setState('error')
    }
  }, [jobId, selectedProvider, router])

  // 生成简历
  const generateResume = async () => {
    if (!result) return

    setIsGeneratingResume(true)
    try {
      const response = await fetch('/api/resumes/generate-v2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: result.sessionId,
          provider: selectedProvider,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to generate resume')
      }

      const data = await response.json()
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

  // 加载状态
  if (state === 'loading') {
    return (
      <div className="space-y-6">
        <AIProviderSelector
          selectedProvider={selectedProvider}
          onSelect={setSelectedProvider}
        />

        <Card>
          <CardContent className="py-16">
            <div className="text-center">
              <Loader2 className="w-12 h-12 text-primary-600 animate-spin mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                AI正在进行8维度深度分析...
              </h3>
              <p className="text-sm text-gray-500">
                这可能需要30-60秒，请耐心等待
              </p>
              <div className="mt-6 max-w-md mx-auto">
                <div className="bg-gray-100 rounded-full h-2 overflow-hidden">
                  <div className="bg-primary-600 h-2 rounded-full animate-pulse w-2/3" />
                </div>
              </div>
              <div className="mt-4 text-xs text-gray-400 space-y-1">
                <p>正在分析角色定位...</p>
                <p>正在匹配关键词...</p>
                <p>正在生成CV策略...</p>
              </div>
            </div>
          </CardContent>
        </Card>
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
          onClick={generateResume}
          disabled={isGeneratingResume}
          className="gap-2"
        >
          {isGeneratingResume ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              AI正在生成简历...
            </>
          ) : (
            <>
              <FileText className="w-4 h-4" />
              根据策略生成简历
            </>
          )}
        </Button>
      </div>
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
