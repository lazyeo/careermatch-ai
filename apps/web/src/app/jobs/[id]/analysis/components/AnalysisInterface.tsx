'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@careermatch/ui'
import { Sparkles } from 'lucide-react'
import { AIProviderSelector, type AIProviderType } from './AIProviderSelector'
import { AnalyzeButton } from './AnalyzeButton'

interface AnalysisInterfaceProps {
  jobId: string
  resumeId: string
}

export function AnalysisInterface({ jobId, resumeId }: AnalysisInterfaceProps) {
  const [selectedProvider, setSelectedProvider] = useState<AIProviderType | undefined>(undefined)

  return (
    <div className="space-y-6">
      {/* AI Provider Selection */}
      <AIProviderSelector selectedProvider={selectedProvider} onSelect={setSelectedProvider} />

      {/* Analysis Trigger */}
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <Sparkles className="w-12 h-12 text-primary-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">准备开始分析</h3>
            <p className="text-sm text-gray-600 mb-6 max-w-md mx-auto">
              点击下方按钮，AI将深度分析您的简历与该岗位的匹配度， 包括9维度分析、SWOT分析和关键词匹配
            </p>
            <AnalyzeButton jobId={jobId} resumeId={resumeId} provider={selectedProvider} />
            <p className="text-xs text-gray-500 mt-4">⏱️ 分析通常需要15-30秒</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
