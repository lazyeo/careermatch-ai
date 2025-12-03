'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { Button, Card, CardContent, CardHeader, CardTitle } from '@careermatch/ui'
import { Sparkles, Loader2, CheckCircle, User } from 'lucide-react'
import { MarkdownAnalysis } from './MarkdownAnalysis'
import { ScoreCard } from './ScoreCard'
import type { AnalysisRecommendation } from '@careermatch/shared'
import type { AIProviderType } from '@/lib/ai-providers'

// Track which jobs have auto-started to prevent duplicate requests in React Strict Mode
const autoStartedJobs = new Set<string>()

interface ProfileStreamingAnalysisProps {
  jobId: string
  provider?: AIProviderType
  onComplete?: (sessionId: string) => void
  autoStart?: boolean
  existingSession?: {
    id: string
    score: number
    recommendation: string
    analysis: string
    provider: string
    model: string
  } | null
}

type StreamState = 'idle' | 'streaming' | 'completed' | 'error'

export function ProfileStreamingAnalysis({
  jobId,
  provider,
  onComplete,
  autoStart = false,
  existingSession = null,
}: ProfileStreamingAnalysisProps) {
  // Initialize state: if existingSession, start with completed state
  const [state, setState] = useState<StreamState>(() => existingSession ? 'completed' : 'idle')
  const hasAutoStarted = useRef(false)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_content, setContent] = useState('')
  const [analysisContent, setAnalysisContent] = useState(() => existingSession?.analysis || '')
  const [score, setScore] = useState<number | null>(() => existingSession?.score ?? null)
  const [recommendation, setRecommendation] = useState<AnalysisRecommendation | null>(() =>
    (existingSession?.recommendation as AnalysisRecommendation) ?? null
  )
  const [error, setError] = useState<string | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(() => existingSession?.id ?? null)
  const [isGeneratingResume, setIsGeneratingResume] = useState(false)
  const [tokenCount, setTokenCount] = useState(0)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Parse streaming content to extract analysis section
  const parseStreamingContent = useCallback((fullContent: string) => {
    // Try to extract score
    const scoreMatch = fullContent.match(/---SCORE---\s*(\d+)/i)
    if (scoreMatch) {
      setScore(Math.max(0, Math.min(100, parseInt(scoreMatch[1], 10))))
    }

    // Try to extract recommendation
    const recMatch = fullContent.match(
      /---RECOMMENDATION---\s*(strong|moderate|weak|not_recommended)/i
    )
    if (recMatch) {
      setRecommendation(recMatch[1] as AnalysisRecommendation)
    }

    // Extract analysis content (everything after ---ANALYSIS---)
    const analysisMatch = fullContent.match(/---ANALYSIS---\s*([\s\S]*?)(?:---END---|$)/i)
    if (analysisMatch && analysisMatch[1]) {
      setAnalysisContent(analysisMatch[1].trim())
    } else if (fullContent.includes('---ANALYSIS---')) {
      // Still streaming analysis section
      const analysisStart = fullContent.indexOf('---ANALYSIS---')
      const afterAnalysis = fullContent.substring(analysisStart + 14).trim()
      setAnalysisContent(afterAnalysis)
    }
  }, [])

  const startStreaming = async () => {
    // Prevent starting if already streaming
    if (abortControllerRef.current) {
      console.log('[ProfileStreamingAnalysis] Already streaming, skipping...')
      return
    }

    console.log('[ProfileStreamingAnalysis] Starting new stream...')
    abortControllerRef.current = new AbortController()
    setState('streaming')
    setContent('')
    setAnalysisContent('')
    setScore(null)
    setRecommendation(null)
    setError(null)
    setSessionId(null)
    setTokenCount(0)

    try {
      const response = await fetch(`/api/jobs/${jobId}/analyze/profile-stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider }),
        signal: abortControllerRef.current.signal,
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to start analysis')
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('No response body')
      }

      const decoder = new TextDecoder()
      let buffer = ''
      let fullContent = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })

        // Process complete SSE messages
        const lines = buffer.split('\n\n')
        buffer = lines.pop() || '' // Keep incomplete message in buffer

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))

              if (data.error) {
                throw new Error(data.error)
              }

              if (data.content) {
                fullContent += data.content
                setContent(fullContent)
                parseStreamingContent(fullContent)

                // Estimate token count (rough: ~4 chars per token for Chinese/English mix)
                setTokenCount(Math.ceil(fullContent.length / 4))
              }

              if (data.done) {
                setState('completed')
                // Use server-provided values, with defaults
                const finalScore = data.score !== undefined ? data.score : 50
                const finalRecommendation = data.recommendation || 'moderate'

                if (data.sessionId) {
                  setSessionId(data.sessionId)
                  onComplete?.(data.sessionId)
                }
                if (data.score !== undefined) {
                  setScore(data.score)
                }
                if (data.recommendation) {
                  setRecommendation(data.recommendation)
                }

                // 发送结果到localStorage，通知对话框更新卡片
                try {
                  // Extract analysis content for summary
                  let currentAnalysis = ''
                  const analysisMatch = fullContent.match(/---ANALYSIS---\s*([\s\S]*?)(?:---END---|$)/i)
                  if (analysisMatch && analysisMatch[1]) {
                    currentAnalysis = analysisMatch[1].trim()
                  } else if (fullContent.includes('---ANALYSIS---')) {
                    const analysisStart = fullContent.indexOf('---ANALYSIS---')
                    currentAnalysis = fullContent.substring(analysisStart + 14).trim()
                  }

                  const resultData = JSON.stringify({
                    score: finalScore,
                    recommendation: finalRecommendation,
                    sessionId: data.sessionId,
                    summary: currentAnalysis.substring(0, 100) + '...',
                    analysisType: 'profile_based',
                  })
                  const storageKey = `analysis-result-${jobId}`
                  localStorage.setItem(storageKey, resultData)

                  // 手动触发 storage 事件（同标签页内 localStorage 变化不会自动触发）
                  window.dispatchEvent(new StorageEvent('storage', {
                    key: storageKey,
                    newValue: resultData,
                    storageArea: localStorage
                  }))
                } catch (e) {
                  console.warn('Failed to store analysis result:', e)
                }
              }
            } catch (e) {
              if (e instanceof SyntaxError) {
                console.warn('Failed to parse SSE message:', line)
              } else {
                throw e
              }
            }
          }
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        console.log('Stream aborted')
        return
      }
      console.error('Streaming error:', err)
      setError(err instanceof Error ? err.message : 'Streaming failed')
      setState('error')
    }
  }

  // Cleanup on unmount - but don't abort if streaming was auto-started
  // This prevents React Strict Mode from aborting legitimate requests
  useEffect(() => {
    return () => {
      // Only abort if this job wasn't auto-started (manual start can be safely aborted)
      // Auto-started streams should complete even if component unmounts temporarily (Strict Mode)
      if (abortControllerRef.current && !autoStartedJobs.has(jobId)) {
        console.log('[ProfileStreamingAnalysis] Cleanup: aborting manual stream')
        abortControllerRef.current.abort()
      } else if (abortControllerRef.current && autoStartedJobs.has(jobId)) {
        console.log('[ProfileStreamingAnalysis] Cleanup: preserving auto-started stream')
      }
    }
  }, [jobId])

  // Auto-start streaming if autoStart prop is true
  // Use module-level Set to track started jobs and prevent React Strict Mode double-mount issues
  useEffect(() => {
    console.log('[ProfileStreamingAnalysis] autoStart useEffect:', {
      autoStart,
      hasAutoStarted: hasAutoStarted.current,
      alreadyStarted: autoStartedJobs.has(jobId),
      state
    })
    if (autoStart && !hasAutoStarted.current && !autoStartedJobs.has(jobId)) {
      console.log('[ProfileStreamingAnalysis] Starting streaming automatically...')
      hasAutoStarted.current = true
      autoStartedJobs.add(jobId)
      startStreaming()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Auto-scroll to bottom while streaming
  const contentRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (state === 'streaming' && contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight
    }
  }, [analysisContent, state])

  if (state === 'idle') {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <div className="relative w-16 h-16 mx-auto mb-4">
              <User className="w-16 h-16 text-primary-200" />
              <Sparkles className="w-6 h-6 text-primary-600 absolute -right-1 -bottom-1" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              基于个人档案的智能分析
            </h3>
            <p className="text-sm text-gray-600 mb-2">
              AI将基于您的个人档案信息分析与该岗位的匹配度
            </p>
            <p className="text-xs text-gray-500 mb-6">
              分析完成后，您将获得针对性的简历撰写建议
            </p>
            <Button variant="primary" onClick={startStreaming} className="gap-2">
              <Sparkles className="w-4 h-4" />
              开始档案分析
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (state === 'error') {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-error-100 text-error-600 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">!</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">分析失败</h3>
            <p className="text-sm text-gray-600 mb-4">{error}</p>
            <Button variant="primary" onClick={startStreaming}>
              重试
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Score Card - Show when available */}
      {score !== null && recommendation && (
        <ScoreCard score={score} recommendation={recommendation} />
      )}

      {/* Analysis Type Badge */}
      <div className="flex items-center gap-2 px-1">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium">
          <User className="w-3 h-3" />
          基于个人档案分析
        </span>
        <span className="text-xs text-gray-500">
          分析结果包含简历撰写建议
        </span>
      </div>

      {/* Streaming Analysis */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              {state === 'streaming' ? (
                <>
                  <Loader2 className="w-5 h-5 text-primary-600 animate-spin" />
                  AI正在分析...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5 text-success-600" />
                  分析完成
                </>
              )}
            </CardTitle>
            {state === 'streaming' && (
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-500 animate-pulse">
                  实时生成中
                </span>
                <span className="text-xs font-mono text-primary-600 bg-primary-50 px-2 py-1 rounded">
                  ~{tokenCount} tokens
                </span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div
            ref={contentRef}
            className="max-h-[600px] overflow-y-auto"
          >
            {analysisContent ? (
              <MarkdownAnalysis content={analysisContent} />
            ) : state === 'streaming' ? (
              <div className="flex items-center gap-2 text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>正在准备分析内容...</span>
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      {state === 'completed' && (
        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={startStreaming}>
            重新分析
          </Button>
          <Button
            variant="primary"
            onClick={async () => {
              if (!sessionId) {
                alert('会话ID不存在，无法生成简历')
                return
              }

              setIsGeneratingResume(true)
              try {
                // 调用AI生成简历API
                const response = await fetch('/api/resumes/generate-from-analysis', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    sessionId: sessionId,
                    provider: provider,
                  }),
                })

                if (!response.ok) {
                  const data = await response.json()
                  throw new Error(data.error || '生成简历失败')
                }

                const result = await response.json()

                // 跳转到简历预览页面
                window.location.href = `/resumes/preview/${result.resumeId}`
              } catch (err) {
                console.error('Error generating resume:', err)
                alert(err instanceof Error ? err.message : '生成简历失败，请重试')
              } finally {
                setIsGeneratingResume(false)
              }
            }}
            disabled={isGeneratingResume}
          >
            {isGeneratingResume ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                AI正在生成简历...
              </>
            ) : (
              '根据建议创建简历'
            )}
          </Button>
        </div>
      )}
    </div>
  )
}
