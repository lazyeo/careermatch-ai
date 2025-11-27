'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@careermatch/ui'
import { Sparkles, Zap, Clock } from 'lucide-react'
import { AIProviderSelector, type AIProviderType } from './AIProviderSelector'
import { AnalyzeButton } from './AnalyzeButton'
import { StreamingAnalysis } from './StreamingAnalysis'

interface AnalysisInterfaceProps {
  jobId: string
  resumeId: string
}

type AnalysisMode = 'select' | 'streaming' | 'batch'

export function AnalysisInterface({ jobId, resumeId }: AnalysisInterfaceProps) {
  const router = useRouter()
  const [selectedProvider, setSelectedProvider] = useState<AIProviderType | undefined>(undefined)
  const [mode, setMode] = useState<AnalysisMode>('select')

  const handleStreamingComplete = (sessionId: string) => {
    // Refresh the page to show the completed analysis
    router.refresh()
  }

  // Streaming mode - show real-time analysis
  if (mode === 'streaming') {
    return (
      <div className="space-y-6">
        <AIProviderSelector selectedProvider={selectedProvider} onSelect={setSelectedProvider} />
        <StreamingAnalysis
          jobId={jobId}
          resumeId={resumeId}
          provider={selectedProvider}
          onComplete={handleStreamingComplete}
        />
      </div>
    )
  }

  // Batch mode - use existing analyze button
  if (mode === 'batch') {
    return (
      <div className="space-y-6">
        <AIProviderSelector selectedProvider={selectedProvider} onSelect={setSelectedProvider} />
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Sparkles className="w-12 h-12 text-primary-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">准备开始分析</h3>
              <p className="text-sm text-gray-600 mb-6 max-w-md mx-auto">
                点击下方按钮，AI将深度分析您的简历与该岗位的匹配度
              </p>
              <AnalyzeButton jobId={jobId} resumeId={resumeId} provider={selectedProvider} />
              <p className="text-xs text-gray-500 mt-4">⏱️ 分析通常需要60-90秒</p>
              <button
                onClick={() => setMode('select')}
                className="text-xs text-primary-600 hover:text-primary-700 mt-2 underline"
              >
                返回选择
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Selection mode - let user choose analysis mode
  return (
    <div className="space-y-6">
      <AIProviderSelector selectedProvider={selectedProvider} onSelect={setSelectedProvider} />

      <Card>
        <CardContent className="py-8">
          <div className="text-center mb-8">
            <Sparkles className="w-12 h-12 text-primary-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">选择分析模式</h3>
            <p className="text-sm text-gray-600">
              选择您喜欢的分析方式
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4 max-w-2xl mx-auto">
            {/* Streaming Mode */}
            <button
              onClick={() => setMode('streaming')}
              className="p-6 border-2 border-primary-200 rounded-xl hover:border-primary-400 hover:bg-primary-50/50 transition-all text-left group"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-primary-100 text-primary-600 flex items-center justify-center group-hover:bg-primary-200 transition-colors">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">流式分析</h4>
                  <span className="text-xs text-primary-600 font-medium">推荐</span>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                实时查看AI生成的分析内容，边生成边显示
              </p>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Clock className="w-3 h-3" />
                <span>体验更流畅</span>
              </div>
            </button>

            {/* Batch Mode */}
            <button
              onClick={() => setMode('batch')}
              className="p-6 border-2 border-gray-200 rounded-xl hover:border-gray-300 hover:bg-gray-50/50 transition-all text-left group"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-gray-100 text-gray-600 flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">批量分析</h4>
                  <span className="text-xs text-gray-500">传统模式</span>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                等待AI完成全部分析后一次性显示结果
              </p>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Clock className="w-3 h-3" />
                <span>约60-90秒</span>
              </div>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
