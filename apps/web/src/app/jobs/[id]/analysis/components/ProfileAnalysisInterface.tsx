'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, Button } from '@careermatch/ui'
import { User, Sparkles, FileText, ArrowRight } from 'lucide-react'
import { AIProviderSelector, type AIProviderType } from './AIProviderSelector'
import { ProfileStreamingAnalysis } from './ProfileStreamingAnalysis'
import { useTranslations } from 'next-intl'

interface ProfileAnalysisInterfaceProps {
  jobId: string
  hasResumes?: boolean
}

type AnalysisState = 'intro' | 'analyzing'

export function ProfileAnalysisInterface({ jobId, hasResumes = false }: ProfileAnalysisInterfaceProps) {
  const router = useRouter()
  const t = useTranslations('analysis')
  const [selectedProvider, setSelectedProvider] = useState<AIProviderType | undefined>(undefined)
  const [state, setState] = useState<AnalysisState>('intro')

  const handleComplete = (sessionId: string) => {
    // Refresh to show updated state
    router.refresh()
  }

  // Analyzing state - show streaming analysis
  if (state === 'analyzing') {
    return (
      <div className="space-y-6">
        <AIProviderSelector selectedProvider={selectedProvider} onSelect={setSelectedProvider} />
        <ProfileStreamingAnalysis
          jobId={jobId}
          provider={selectedProvider}
          onComplete={handleComplete}
        />
      </div>
    )
  }

  // Intro state - explain profile-based analysis
  return (
    <div className="space-y-6">
      <AIProviderSelector selectedProvider={selectedProvider} onSelect={setSelectedProvider} />

      <Card>
        <CardContent className="py-8">
          <div className="text-center mb-8">
            <div className="relative w-16 h-16 mx-auto mb-4">
              <User className="w-16 h-16 text-blue-200" />
              <Sparkles className="w-6 h-6 text-blue-600 absolute -right-1 -bottom-1" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {t('profileBasedTitle')}
            </h3>
            <p className="text-sm text-gray-600 max-w-md mx-auto">
              {t('profileBasedDesc')}
            </p>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-4 max-w-2xl mx-auto mb-8">
            <div className="text-center p-4">
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-2">
                <span className="font-bold">1</span>
              </div>
              <h4 className="text-sm font-medium text-gray-900">{t('features.matchEvaluation')}</h4>
              <p className="text-xs text-gray-500 mt-1">{t('features.matchEvaluationDesc')}</p>
            </div>
            <div className="text-center p-4">
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-2">
                <span className="font-bold">2</span>
              </div>
              <h4 className="text-sm font-medium text-gray-900">{t('features.strengthsWeaknesses')}</h4>
              <p className="text-xs text-gray-500 mt-1">{t('features.strengthsWeaknessesDesc')}</p>
            </div>
            <div className="text-center p-4">
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-2">
                <span className="font-bold">3</span>
              </div>
              <h4 className="text-sm font-medium text-gray-900">{t('features.resumeSuggestions')}</h4>
              <p className="text-xs text-gray-500 mt-1">{t('features.resumeSuggestionsDesc')}</p>
            </div>
          </div>

          {/* Action Button */}
          <div className="text-center">
            <Button
              variant="primary"
              onClick={() => setState('analyzing')}
              className="gap-2"
            >
              <Sparkles className="w-4 h-4" />
              {t('startProfileAnalysis')}
            </Button>

            {hasResumes && (
              <div className="mt-4">
                <Link href={`/jobs/${jobId}/analysis`}>
                  <button className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mx-auto">
                    <FileText className="w-4 h-4" />
                    {t('orUseResume')}
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </Link>
              </div>
            )}

            {!hasResumes && (
              <p className="text-xs text-gray-500 mt-4">
                {t('noResumeHint')}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
