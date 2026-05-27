'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  Field,
  fieldControlClasses,
} from '@careermatch/ui'
import type { ParsedJobData } from '@careermatch/job-scraper'
import { useTranslations } from 'next-intl'
import { AlertCircle, CheckCircle2, LinkIcon, RotateCcw } from 'lucide-react'

interface ParsedJobResult {
  success: boolean
  parsed_data?: ParsedJobData
  job_id?: string
  message?: string
  error?: string
  input?: string
}

interface BatchImportResponse {
  success: boolean
  results: ParsedJobResult[]
  error?: string
}

export function JobImportForm() {
  const router = useRouter()
  const t = useTranslations('jobs.import')
  const [urls, setUrls] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [parsedResults, setParsedResults] = useState<ParsedJobResult[]>([])
  const [isSaving, setIsSaving] = useState(false)

  // 解析岗位
  const handleParse = async () => {
    setIsLoading(true)
    setError(null)
    setParsedResults([])

    try {
      const extractedUrls = urls.match(/https?:\/\/[^\s,;"']+/g) || []
      const uniqueUrls = Array.from(new Set(extractedUrls))

      if (uniqueUrls.length === 0) {
        throw new Error(t('errors.noUrl'))
      }

      const response = await fetch('/api/jobs/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls: uniqueUrls }),
      })

      const result: BatchImportResponse = await response.json()

      if (!response.ok) {
        throw new Error(result.error || t('errors.parseFailed'))
      }

      if (result.results) {
        setParsedResults(result.results)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.parseFailed'))
    } finally {
      setIsLoading(false)
    }
  }

  // 保存岗位 (单个)
  const handleSave = async (data: ParsedJobData, originalUrl?: string) => {
    setIsSaving(true)
    setError(null)

    try {
      const response = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: data.title,
          company: data.company,
          location: data.location,
          job_type: data.job_type,
          salary_min: data.salary_min,
          salary_max: data.salary_max,
          salary_currency: data.salary_currency,
          description: data.description,
          requirements: data.requirements,
          benefits: data.benefits,
          source_url: originalUrl || urls.split('\n')[0] || null,
          posted_date: data.posted_date,
          deadline: data.deadline,
          status: 'saved',
        }),
      })

      if (!response.ok) {
        throw new Error(t('errors.saveFailed'))
      }

      // Remove saved item from list or mark as saved
      // For simplicity, we just refresh the page or show success
      // Ideally we update local state to show "Saved"
      router.refresh()
      return true
    } catch (err) {
      console.error(err)
      return false
    } finally {
      setIsSaving(false)
    }
  }

  // 批量保存所有成功解析的
  const handleSaveAll = async () => {
    setIsSaving(true)
    let successCount = 0

    for (const result of parsedResults) {
      if (result.success && result.parsed_data) {
        const success = await handleSave(result.parsed_data, result.input)
        if (success) successCount++
      }
    }

    setIsSaving(false)
    if (successCount > 0) {
      router.push('/jobs')
    }
  }

  // 重置
  const handleReset = () => {
    setParsedResults([])
    setError(null)
    setUrls('')
  }

  return (
    <div className="space-y-6">
      {/* 导入方式选择 */}
      {parsedResults.length === 0 && (
        <Card>
          <CardHeader className="border-b border-line pb-4">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-md bg-brick-soft text-brick">
                <LinkIcon className="h-4 w-4" />
              </span>
              <div>
                <CardTitle>{t('title')}</CardTitle>
                <p className="mt-1 text-sm text-ink-3">
              {t('description')}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <Badge tone="brick" plain>{t('urlMode')}</Badge>

            <Field label={t('urlLabel')} hint={t('urlHelp')}>
              <textarea
                value={urls}
                onChange={(e) => setUrls(e.target.value)}
                rows={5}
                placeholder={t('urlPlaceholder')}
                className={`${fieldControlClasses} h-auto min-h-32 py-3 font-mono`}
              />
            </Field>

            {error && (
              <div className="mt-4 flex items-start gap-2 rounded-md border border-clay-soft bg-clay-soft p-3 text-sm text-clay">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-none" />
                {error}
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <Button
                onClick={handleParse}
                variant="primary"
                disabled={isLoading || !urls.trim()}
              >
                {isLoading ? t('parsingButton') : t('parseButton')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 解析结果预览 */}
      {parsedResults.length > 0 && (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 rounded-lg border border-line bg-surface p-5 shadow-xs sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-ink">
                {t('resultsTitle', {
                  success: parsedResults.filter(r => r.success).length,
                  total: parsedResults.length,
                })}
              </h2>
              <p className="mt-1 text-sm text-ink-3">
                {t('resultsDescription')}
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={handleReset}>
                <RotateCcw className="h-4 w-4" />
                {t('restart')}
              </Button>
              <Button
                variant="primary"
                onClick={handleSaveAll}
                disabled={isSaving || parsedResults.filter(r => r.success).length === 0}
              >
                {isSaving ? t('saving') : t('saveAll')}
              </Button>
            </div>
          </div>

          {parsedResults.map((result, index) => (
            <Card key={index} className={result.success ? '' : 'border-clay-soft'}>
              <CardHeader className="border-b border-line pb-4">
                <CardTitle className="flex items-center justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <Badge tone={result.success ? 'sage' : 'clay'}>
                      {result.success ? <CheckCircle2 className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                      {result.success ? t('success') : t('failed')}
                    </Badge>
                    {result.input && (
                      <span className="truncate text-sm font-normal text-ink-3">
                        {result.input}
                      </span>
                    )}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {result.success && result.parsed_data ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-ink-3">{t('jobTitle')}</label>
                        <div className="font-medium">{result.parsed_data.title}</div>
                      </div>
                      <div>
                        <label className="text-xs text-ink-3">{t('company')}</label>
                        <div className="font-medium">{result.parsed_data.company}</div>
                      </div>
                      <div>
                        <label className="text-xs text-ink-3">{t('location')}</label>
                        <div>{result.parsed_data.location || '-'}</div>
                      </div>
                      <div>
                        <label className="text-xs text-ink-3">{t('salary')}</label>
                        <div className="text-sage">
                          {result.parsed_data.salary_min
                            ? `${result.parsed_data.salary_currency} ${result.parsed_data.salary_min.toLocaleString()}`
                            : '-'}
                        </div>
                      </div>
                    </div>
                    {/* 简略描述 */}
                    <div>
                      <label className="text-xs text-ink-3">{t('descriptionPreview')}</label>
                      <div className="line-clamp-2 text-sm text-ink-2">
                        {result.parsed_data.description}
                      </div>
                    </div>
                  </div>
                ) : (
                  <EmptyState title={result.error || t('unknownError')} icon={<AlertCircle className="h-5 w-5" />} />
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
