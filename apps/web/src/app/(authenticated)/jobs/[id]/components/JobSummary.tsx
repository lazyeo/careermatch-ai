'use client'

import { useState, useRef, useEffect } from 'react'
import { Button, Card, CardContent } from '@careermatch/ui'
import { Sparkles, Loader2, AlertCircle } from 'lucide-react'
import { MarkdownAnalysis } from '../analysis/components/MarkdownAnalysis'

interface JobSummaryProps {
    jobId: string
    initialContent?: string
}

export function JobSummary({ jobId, initialContent = '' }: JobSummaryProps) {
    const [content, setContent] = useState(initialContent)
    const [isStreaming, setIsStreaming] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const abortControllerRef = useRef<AbortController | null>(null)

    const startStreaming = async () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort()
        }

        abortControllerRef.current = new AbortController()
        setIsStreaming(true)
        setError(null)
        setContent('')

        try {
            const response = await fetch(`/api/jobs/${jobId}/analyze/stream`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mode: 'job_summary' }),
                signal: abortControllerRef.current.signal,
            })

            if (!response.ok) {
                throw new Error('Failed to start analysis')
            }

            const reader = response.body?.getReader()
            if (!reader) throw new Error('No response body')

            const decoder = new TextDecoder()
            let buffer = ''

            while (true) {
                const { done, value } = await reader.read()
                if (done) break

                buffer += decoder.decode(value, { stream: true })
                const lines = buffer.split('\n\n')
                buffer = lines.pop() || ''

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        try {
                            const data = JSON.parse(line.slice(6))
                            if (data.content) {
                                setContent(prev => prev + data.content)
                            }
                            if (data.done) {
                                setIsStreaming(false)
                            }
                            if (data.error) {
                                throw new Error(data.error)
                            }
                        } catch (e) {
                            console.warn('Error parsing SSE:', e)
                        }
                    }
                }
            }
        } catch (err) {
            if (err instanceof Error && err.name === 'AbortError') return
            setError(err instanceof Error ? err.message : 'Analysis failed')
            setIsStreaming(false)
        }
    }

    // Cleanup
    useEffect(() => {
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort()
            }
        }
    }, [])

    if (!content && !isStreaming && !error) {
        return (
            <Card className="bg-gradient-to-br from-primary-50 to-white border-primary-100">
                <CardContent className="py-8 text-center">
                    <Sparkles className="w-12 h-12 text-primary-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        AI 职位深度点评
                    </h3>
                    <p className="text-sm text-gray-600 mb-6 max-w-md mx-auto">
                        让 AI 为您分析该职位的亮点、潜在风险以及核心竞争力要求，助您做出更明智的决策。
                    </p>
                    <Button onClick={startStreaming} className="gap-2">
                        <Sparkles className="w-4 h-4" />
                        生成职位点评
                    </Button>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary-500" />
                    AI 职位点评
                </h3>
                {isStreaming && (
                    <span className="text-xs text-primary-600 flex items-center gap-1">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        正在分析...
                    </span>
                )}
                {!isStreaming && content && (
                    <Button variant="outline" size="sm" onClick={startStreaming}>
                        重新生成
                    </Button>
                )}
            </div>

            {error && (
                <div className="p-4 bg-error-50 text-error-700 rounded-lg flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    {error}
                </div>
            )}

            {(content || isStreaming) && (
                <Card>
                    <CardContent className="py-6">
                        <MarkdownAnalysis content={content} />
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
