'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button, Card, CardContent, CardHeader, CardTitle } from '@careermatch/ui'
import { Sparkles, MessageCircle, RefreshCw } from 'lucide-react'
import { ScoreCard } from './ScoreCard'
import { MarkdownAnalysis } from './MarkdownAnalysis'
import { ChatInterface } from './ChatInterface'
import { AnalysisInterface } from './AnalysisInterface'
import type { AnalysisRecommendation } from '@careermatch/shared'

interface AnalysisSession {
  id: string
  score: number
  recommendation: string
  analysis: string
  provider?: string
  model?: string
}

interface Message {
  id: string
  role: string
  content: string
  created_at: string
}

interface AnalysisResultsViewProps {
  session: AnalysisSession
  messages: Message[]
  jobId: string
  resumeId: string
}

export function AnalysisResultsView({
  session,
  messages,
  jobId,
  resumeId,
}: AnalysisResultsViewProps) {
  const [showReanalysis, setShowReanalysis] = useState(false)

  // If user wants to re-analyze, show the AnalysisInterface (with streaming option)
  if (showReanalysis) {
    return (
      <div className="space-y-6">
        {/* Back button */}
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">重新分析</h2>
          <Button
            variant="ghost"
            onClick={() => setShowReanalysis(false)}
            className="text-sm"
          >
            返回上次结果
          </Button>
        </div>

        {/* Analysis Interface with mode selection */}
        <AnalysisInterface jobId={jobId} resumeId={resumeId} />
      </div>
    )
  }

  // Show existing analysis results
  return (
    <div className="space-y-6">
      {/* 评分卡片 */}
      <ScoreCard
        score={session.score}
        recommendation={session.recommendation as AnalysisRecommendation}
      />

      {/* AI分析报告 - Markdown渲染 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary-600" />
              AI深度分析报告
            </CardTitle>
            <span className="text-xs text-gray-500">
              由 {session.provider?.toUpperCase()} 提供 · {session.model}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <MarkdownAnalysis content={session.analysis} />
        </CardContent>
      </Card>

      {/* 对话区域 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-primary-600" />
            与AI顾问对话
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">
            有任何问题都可以继续追问，AI顾问会为你提供更详细的分析和建议
          </p>
          <ChatInterface
            sessionId={session.id}
            jobId={jobId}
            initialMessages={messages}
          />
        </CardContent>
      </Card>

      {/* 操作按钮 */}
      <div className="flex gap-3 justify-end">
        <Button
          variant="secondary"
          onClick={() => setShowReanalysis(true)}
          className="gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          重新分析
        </Button>
        <Link href={`/jobs/${jobId}/analysis/optimize?resumeId=${resumeId}&sessionId=${session.id}`}>
          <Button variant="primary">AI优化简历</Button>
        </Link>
      </div>
    </div>
  )
}
