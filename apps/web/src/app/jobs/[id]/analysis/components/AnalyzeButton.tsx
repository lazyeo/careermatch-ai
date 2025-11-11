'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@careermatch/ui'
import { Loader2, Sparkles } from 'lucide-react'

interface AnalyzeButtonProps {
  jobId: string
  resumeId: string
  label?: string
}

export function AnalyzeButton({ jobId, resumeId, label = '开始AI分析' }: AnalyzeButtonProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleAnalyze = async () => {
    setIsAnalyzing(true)
    setError(null)

    try {
      const response = await fetch(`/api/jobs/${jobId}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ resumeId }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || '分析失败')
      }

      // Refresh the page to show results
      router.refresh()
    } catch (err) {
      console.error('Error analyzing:', err)
      setError(err instanceof Error ? err.message : '分析失败，请重试')
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
            分析中...
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            {label}
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
