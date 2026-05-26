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
          <h2 className="text-lg font-semibold text-gray-900">Run Analysis Again</h2>
          <Button
            variant="ghost"
            onClick={() => setShowReanalysis(false)}
            className="text-sm"
          >
            Back to Previous Result
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
              AI Analysis Report
            </CardTitle>
            <span className="text-xs text-gray-500">
              Powered by {session.provider?.toUpperCase()} · {session.model}
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
            Chat with the AI Advisor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">
            Ask follow-up questions to explore the analysis and get more specific guidance.
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
          variant="outline"
          onClick={() => setShowReanalysis(true)}
          className="gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Run Again
        </Button>
        <Link href={`/jobs/${jobId}/analysis/optimize?resumeId=${resumeId}&sessionId=${session.id}`}>
          <Button variant="primary">Optimize Resume with AI</Button>
        </Link>
      </div>
    </div>
  )
}
