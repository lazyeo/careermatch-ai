'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { Button, Card, CardContent, CardHeader, CardTitle } from '@careermatch/ui'
import { ArrowLeft, Loader2, Sparkles, Check, X, ArrowRight } from 'lucide-react'

interface ResumeContent {
  personal_info?: {
    fullName?: string
    email?: string
    phone?: string
    location?: string
  }
  careerObjective?: string
  skills?: Array<{ name: string; level?: string; category?: string }>
  workExperience?: Array<{
    company: string
    position: string
    startDate?: string
    endDate?: string
    description?: string
    highlights?: string[]
  }>
  education?: Array<{
    school: string
    degree?: string
    field?: string
    startDate?: string
    endDate?: string
  }>
  projects?: Array<{
    name: string
    description?: string
    technologies?: string[]
  }>
}

interface OptimizeResponse {
  optimizedContent: ResumeContent
  changes: string[]
  originalContent: ResumeContent
}

export default function OptimizeResumePage({
  params,
}: {
  params: { id: string }
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const resumeId = searchParams.get('resumeId')
  const sessionId = searchParams.get('sessionId')
  const t = useTranslations('analysis.optimize')
  const tCommon = useTranslations('common')

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<OptimizeResponse | null>(null)

  useEffect(() => {
    if (!resumeId || !sessionId) {
      setError(t('missingParams'))
      setIsLoading(false)
      return
    }

    const fetchOptimization = async () => {
      try {
        const response = await fetch(`/api/jobs/${params.id}/analyze/optimize`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId, resumeId }),
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || t('optimizeFailed'))
        }

        const data = await response.json()
        setResult(data)
      } catch (err) {
        console.error('Optimization error:', err)
        setError(err instanceof Error ? err.message : t('optimizeFailed'))
      } finally {
        setIsLoading(false)
      }
    }

    fetchOptimization()
  }, [params.id, resumeId, sessionId, t])

  const handleApply = async () => {
    if (!result || !resumeId) return

    setIsSaving(true)
    try {
      // Save optimized content to resume
      const response = await fetch(`/api/resumes/${resumeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: result.optimizedContent }),
      })

      if (!response.ok) {
        throw new Error(t('saveFailed'))
      }

      // Redirect back to analysis page
      router.push(`/jobs/${params.id}/analysis?resumeId=${resumeId}`)
    } catch (err) {
      console.error('Save error:', err)
      setError(err instanceof Error ? err.message : t('saveFailed'))
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="py-12 text-center">
            <Loader2 className="w-12 h-12 animate-spin text-primary-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('optimizing')}</h3>
            <p className="text-sm text-gray-600">
              {t('optimizingDesc')}
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="py-12 text-center">
            <X className="w-12 h-12 text-error-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('optimizeFailed')}</h3>
            <p className="text-sm text-gray-600 mb-4">{error}</p>
            <Link href={`/jobs/${params.id}/analysis?resumeId=${resumeId}`}>
              <Button variant="primary">{t('backToAnalysis')}</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!result) return null

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Link href={`/jobs/${params.id}/analysis?resumeId=${resumeId}`}>
              <Button variant="ghost" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                {t('backToAnalysis')}
              </Button>
            </Link>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary-600" />
                <h1 className="text-xl font-bold text-gray-900">{t('title')}</h1>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                {t('subtitle')}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Changes Summary */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Check className="w-5 h-5 text-success-600" />
              {t('mainChanges')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {result.changes.map((change, index) => (
                <li key={index} className="flex items-start gap-2">
                  <ArrowRight className="w-4 h-4 text-primary-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-700">{change}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Side by Side Comparison */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Original */}
          <Card>
            <CardHeader>
              <CardTitle className="text-gray-500">{t('originalResume')}</CardTitle>
            </CardHeader>
            <CardContent>
              <ResumePreview content={result.originalContent} t={t} />
            </CardContent>
          </Card>

          {/* Optimized */}
          <Card className="border-primary-200 bg-primary-50/30">
            <CardHeader>
              <CardTitle className="text-primary-700 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                {t('optimizedResume')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResumePreview content={result.optimizedContent} isOptimized t={t} />
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-end">
          <Link href={`/jobs/${params.id}/analysis?resumeId=${resumeId}`}>
            <Button variant="outline">{tCommon('cancel')}</Button>
          </Link>
          <Button
            variant="primary"
            onClick={handleApply}
            disabled={isSaving}
            className="gap-2"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {t('saving')}
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                {t('applyOptimization')}
              </>
            )}
          </Button>
        </div>
      </main>
    </div>
  )
}

/**
 * Resume Preview Component
 */
function ResumePreview({
  content,
  isOptimized = false,
  t,
}: {
  content: ResumeContent
  isOptimized?: boolean
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: any
}) {
  const highlightClass = isOptimized ? 'bg-primary-100/50' : ''

  return (
    <div className="space-y-4 text-sm">
      {/* Personal Info */}
      {content.personal_info && (
        <div className={`p-3 rounded ${highlightClass}`}>
          <h4 className="font-semibold text-gray-900">
            {content.personal_info.fullName || t('preview.nameNotProvided')}
          </h4>
          <p className="text-gray-600">
            {content.personal_info.email} | {content.personal_info.phone}
          </p>
          {content.personal_info.location && (
            <p className="text-gray-500">{content.personal_info.location}</p>
          )}
        </div>
      )}

      {/* Career Objective */}
      {content.careerObjective && (
        <div className={`p-3 rounded ${highlightClass}`}>
          <h5 className="font-medium text-gray-700 mb-1">{t('preview.careerObjective')}</h5>
          <p className="text-gray-600">{content.careerObjective}</p>
        </div>
      )}

      {/* Skills */}
      {content.skills && content.skills.length > 0 && (
        <div className={`p-3 rounded ${highlightClass}`}>
          <h5 className="font-medium text-gray-700 mb-2">{t('preview.skills')}</h5>
          <div className="flex flex-wrap gap-1">
            {content.skills.map((skill, i) => (
              <span
                key={i}
                className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs"
              >
                {skill.name}
                {skill.level && ` (${skill.level})`}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Work Experience */}
      {content.workExperience && content.workExperience.length > 0 && (
        <div className={`p-3 rounded ${highlightClass}`}>
          <h5 className="font-medium text-gray-700 mb-2">{t('preview.workExperience')}</h5>
          {content.workExperience.map((exp, i) => (
            <div key={i} className="mb-3 last:mb-0">
              <p className="font-medium text-gray-800">{exp.position}</p>
              <p className="text-gray-600">
                {exp.company} | {exp.startDate} - {exp.endDate || t('preview.present')}
              </p>
              {exp.description && (
                <p className="text-gray-500 mt-1">{exp.description}</p>
              )}
              {exp.highlights && exp.highlights.length > 0 && (
                <ul className="mt-1 list-disc list-inside text-gray-500">
                  {exp.highlights.map((h, j) => (
                    <li key={j}>{h}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Projects */}
      {content.projects && content.projects.length > 0 && (
        <div className={`p-3 rounded ${highlightClass}`}>
          <h5 className="font-medium text-gray-700 mb-2">{t('preview.projects')}</h5>
          {content.projects.map((proj, i) => (
            <div key={i} className="mb-2 last:mb-0">
              <p className="font-medium text-gray-800">{proj.name}</p>
              {proj.description && (
                <p className="text-gray-500">{proj.description}</p>
              )}
              {proj.technologies && proj.technologies.length > 0 && (
                <p className="text-xs text-gray-400 mt-1">
                  {t('preview.techStack')}: {proj.technologies.join(', ')}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Education */}
      {content.education && content.education.length > 0 && (
        <div className={`p-3 rounded ${highlightClass}`}>
          <h5 className="font-medium text-gray-700 mb-2">{t('preview.education')}</h5>
          {content.education.map((edu, i) => (
            <div key={i} className="mb-2 last:mb-0">
              <p className="font-medium text-gray-800">{edu.school}</p>
              <p className="text-gray-600">
                {edu.degree} {edu.field} | {edu.startDate} - {edu.endDate || t('preview.present')}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
