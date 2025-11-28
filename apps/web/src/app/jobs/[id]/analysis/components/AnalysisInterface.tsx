'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@careermatch/ui'
import { Sparkles, Zap, Clock } from 'lucide-react'
import { AIProviderSelector, type AIProviderType } from './AIProviderSelector'
import { AnalyzeButton } from './AnalyzeButton'
import { StreamingAnalysis } from './StreamingAnalysis'
import { useTranslations } from 'next-intl'

interface AnalysisInterfaceProps {
  jobId: string
  resumeId: string
}

type AnalysisMode = 'select' | 'streaming' | 'batch'

export function AnalysisInterface({ jobId, resumeId }: AnalysisInterfaceProps) {
  const router = useRouter()
  const t = useTranslations('analysis')
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
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('readyToAnalyze')}</h3>
              <p className="text-sm text-gray-600 mb-6 max-w-md mx-auto">
                {t('readyToAnalyzeDesc')}
              </p>
              <AnalyzeButton jobId={jobId} resumeId={resumeId} provider={selectedProvider} />
              <p className="text-xs text-gray-500 mt-4">{t('analysisTime')}</p>
              <button
                onClick={() => setMode('select')}
                className="text-xs text-primary-600 hover:text-primary-700 mt-2 underline"
              >
                {t('backToSelection')}
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
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('selectAnalysisMode')}</h3>
            <p className="text-sm text-gray-600">
              {t('selectAnalysisModeDesc')}
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
                  <h4 className="font-semibold text-gray-900">{t('streamingAnalysis')}</h4>
                  <span className="text-xs text-primary-600 font-medium">{t('recommended')}</span>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                {t('streamingAnalysisDesc')}
              </p>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Clock className="w-3 h-3" />
                <span>{t('smootherExperience')}</span>
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
                  <h4 className="font-semibold text-gray-900">{t('batchAnalysis')}</h4>
                  <span className="text-xs text-gray-500">{t('traditionalMode')}</span>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                {t('batchAnalysisDesc')}
              </p>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Clock className="w-3 h-3" />
                <span>{t('estimatedTime', { time: '60-90秒' })}</span>
              </div>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
