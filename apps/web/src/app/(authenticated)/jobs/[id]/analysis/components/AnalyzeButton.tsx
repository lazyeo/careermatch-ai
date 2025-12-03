'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@careermatch/ui'
import { Loader2, Sparkles } from 'lucide-react'
import { useTranslations } from 'next-intl'

export type AIProviderType = 'openai' | 'codex' | 'claude' | 'gemini'

interface AnalyzeButtonProps {
  jobId: string
  resumeId: string
  label?: string
  provider?: AIProviderType
  force?: boolean  // Force re-analysis, skip cache
}

export function AnalyzeButton({ jobId, resumeId, label, provider, force = false }: AnalyzeButtonProps) {
  const t = useTranslations('forms.analyzeButton')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const buttonLabel = label || t('defaultLabel')

  const handleAnalyze = async () => {
    setIsAnalyzing(true)
    setError(null)

    try {
      const response = await fetch(`/api/jobs/${jobId}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ resumeId, provider, force }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || t('analysisFailed'))
      }

      // Refresh the page to show results
      router.refresh()
    } catch (err) {
      console.error('Error analyzing:', err)
      setError(err instanceof Error ? err.message : t('retryFailed'))
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <div className="space-y-3">
      <Button
        variant="primary"
        onClick={handleAnalyze}
        disabled={isAnalyzing}
        className="gap-2"
      >
        {isAnalyzing ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            {t('analyzing')}
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            {buttonLabel}
          </>
        )}
      </Button>

      {error && (
        <div className="text-sm text-error-600 bg-error-50 border border-error-200 rounded-lg px-4 py-2">
          {error}
        </div>
      )}
    </div>
  )
}
