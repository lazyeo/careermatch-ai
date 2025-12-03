'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { Button, Card, CardContent, CardHeader, CardTitle } from '@careermatch/ui'
import { Sparkles, Loader2, CheckCircle } from 'lucide-react'
import { MarkdownAnalysis } from './MarkdownAnalysis'
import { ScoreCard } from './ScoreCard'
import type { AnalysisRecommendation } from '@careermatch/shared'
import type { AIProviderType } from '@/lib/ai-providers'

interface StreamingAnalysisProps {
  jobId: string
  resumeId: string
  provider?: AIProviderType
  onComplete?: (sessionId: string) => void
}

type StreamState = 'idle' | 'streaming' | 'completed' | 'error'

export function StreamingAnalysis({
  jobId,
  resumeId,
  provider,
  onComplete,
}: StreamingAnalysisProps) {
  const [state, setState] = useState<StreamState>('idle')
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_content, setContent] = useState('')
  const [analysisContent, setAnalysisContent] = useState('')
  const [score, setScore] = useState<number | null>(null)
  const [recommendation, setRecommendation] = useState<AnalysisRecommendation | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
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
    // Cancel any existing stream
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    abortControllerRef.current = new AbortController()
    setState('streaming')
    setContent('')
    setAnalysisContent('')
    setScore(null)
    setRecommendation(null)
    setError(null)
    setSessionId(null)

    try {
      const response = await fetch(`/api/jobs/${jobId}/analyze/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeId, provider }),
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
              }

              if (data.done) {
                setState('completed')
                const finalScore = data.score !== undefined ? data.score : score
                const finalRecommendation = data.recommendation || recommendation

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
                  const resultData = JSON.stringify({
                    score: finalScore,
                    recommendation: finalRecommendation,
                    sessionId: data.sessionId,
                    summary: analysisContent.substring(0, 100) + '...',
                    analysisType: 'resume_based',
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
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
            <Sparkles className="w-12 h-12 text-primary-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              AI智能分析
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              点击开始，AI将实时生成深度匹配分析报告
            </p>
            <Button variant="primary" onClick={startStreaming} className="gap-2">
              <Sparkles className="w-4 h-4" />
              开始流式分析
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
              <span className="text-xs text-gray-500 animate-pulse">
                实时生成中
              </span>
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
          {sessionId && (
            <Button
              variant="primary"
              onClick={() => {
                window.location.href = `/jobs/${jobId}/analysis/optimize?resumeId=${resumeId}&sessionId=${sessionId}`
              }}
            >
              AI优化简历
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
