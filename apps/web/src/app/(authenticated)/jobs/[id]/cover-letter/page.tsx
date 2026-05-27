'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Segmented,
} from '@careermatch/ui'
import { ArrowLeft, Loader2, FileText, Copy, Download, Check, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase'

interface CoverLetterResult {
  success: boolean
  coverLetter: {
    content: string
    highlights: string[]
    wordCount: number
  }
  job: {
    id: string
    title: string
    company: string
  }
}

export default function CoverLetterPage({
  params,
}: {
  params: { id: string }
}) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _router = useRouter()
  const t = useTranslations('coverLetter')
  const tCommon = useTranslations('common')
  const [isLoading, setIsLoading] = useState(true) // 初始为loading状态
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<CoverLetterResult | null>(null)
  const [copied, setCopied] = useState(false)
  const [tone, setTone] = useState<'professional' | 'friendly' | 'formal'>(
    'professional'
  )
  const [language, setLanguage] = useState<'en' | 'zh'>('en')
  const [existingCoverLetter, setExistingCoverLetter] = useState<{
    id: string
    content: string
    created_at: string
  } | null>(null)

  // 加载时检查是否已有求职信
  useEffect(() => {
    const loadExistingCoverLetter = async () => {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('cover_letters')
          .select('id, content, created_at, title')
          .eq('job_id', params.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        if (data && !error) {
          setExistingCoverLetter(data)
          // 将已有的求职信格式化为result格式
          // 注意：已保存的求职信可能没有highlights和wordCount
          const wordCount = data.content.split(/\s+/).length
          // 获取job信息用于显示
          const { data: jobData } = await supabase
            .from('jobs')
            .select('id, title, company')
            .eq('id', params.id)
            .single()

          if (jobData) {
            setResult({
              success: true,
              coverLetter: {
                content: data.content,
                highlights: [], // 已保存的没有highlights
                wordCount,
              },
              job: {
                id: jobData.id,
                title: jobData.title,
                company: jobData.company,
              },
            })
          }
        }
      } catch (err) {
        console.error('Error loading existing cover letter:', err)
      } finally {
        setIsLoading(false)
      }
    }

    loadExistingCoverLetter()
  }, [params.id])

  const handleGenerate = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/jobs/${params.id}/cover-letter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tone, language }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || t('generationFailed'))
      }

      setResult(data)

      // 更新existingCoverLetter状态
      if (data.coverLetterId) {
        setExistingCoverLetter({
          id: data.coverLetterId,
          content: data.coverLetter.content,
          created_at: new Date().toISOString(),
        })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('generationFailed'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopy = async () => {
    if (!result?.coverLetter.content) return

    try {
      await navigator.clipboard.writeText(result.coverLetter.content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setError(t('copyFailed'))
    }
  }

  const handleDownload = () => {
    if (!result?.coverLetter.content) return

    const blob = new Blob([result.coverLetter.content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Cover_Letter_${result.job.company.replace(/\s+/g, '_')}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-line bg-surface p-6 shadow-xs">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl">
            <Link href={`/jobs/${params.id}`}>
              <Button variant="ghost" className="mb-3 gap-2 px-0 text-ink-3 hover:text-ink">
                <ArrowLeft className="h-4 w-4" />
                {t('backToJob')}
              </Button>
            </Link>
              <div className="flex items-center gap-2 text-brick">
                <FileText className="h-5 w-5" />
                <p className="cm-eyebrow">{t('title')}</p>
              </div>
                <h1 className="mt-2 font-display text-4xl leading-tight text-ink">
                  {t('title')}
                </h1>
              <p className="mt-2 text-sm leading-6 text-ink-2">
                {t('subtitle')}
              </p>
            </div>
          </div>
      </section>

        {isLoading && !result ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-brick" />
                <p className="text-ink-2">{t('loading')}</p>
              </div>
            </CardContent>
          </Card>
        ) : !result ? (
          <Card>
            <CardHeader>
              <CardTitle>{t('generateOptions')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Tone Selection */}
              <div>
                <label className="mb-2 block text-sm font-medium text-ink-2">
                  {t('toneStyle')}
                </label>
                <div className="grid gap-3 md:grid-cols-3">
                  {[
                    { value: 'professional', label: t('tones.professional'), desc: t('tones.professionalDesc') },
                    { value: 'friendly', label: t('tones.friendly'), desc: t('tones.friendlyDesc') },
                    { value: 'formal', label: t('tones.formal'), desc: t('tones.formalDesc') },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() =>
                        setTone(
                          option.value as 'professional' | 'friendly' | 'formal'
                        )
                      }
                      className={`rounded-md border p-4 text-left transition ${
                        tone === option.value
                          ? 'border-brick-soft bg-brick-tint text-brick-ink'
                          : 'border-line bg-surface hover:border-line-strong'
                      }`}
                    >
                      <div className="font-medium">{option.label}</div>
                      <div className="mt-1 text-sm text-ink-3">{option.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Language Selection */}
              <div>
                <label className="mb-2 block text-sm font-medium text-ink-2">
                  {t('language')}
                </label>
                <Segmented
                  value={language}
                  onValueChange={(value) => setLanguage(value as 'en' | 'zh')}
                  options={[
                    { value: 'en', label: t('languages.en') },
                    { value: 'zh', label: t('languages.zh') },
                  ]}
                />
              </div>

              {error && (
                <div className="flex items-start gap-2 rounded-md border border-clay-soft bg-clay-soft p-3 text-sm text-clay">
                  <AlertCircle className="mt-0.5 h-4 w-4 flex-none" />
                  {error}
                </div>
              )}

              <div className="pt-4">
                <Button
                  variant="primary"
                  onClick={handleGenerate}
                  disabled={isLoading}
                  className="w-full gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {t('generating')}
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4" />
                      {t('generate')}
                    </>
                  )}
                </Button>
              </div>

              <p className="text-center text-sm text-ink-3">
                {t('ensureProfile')}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* 已保存提示 */}
            {existingCoverLetter && (
              <div className="flex items-start gap-3 rounded-lg border border-indigo-soft bg-indigo-soft p-4">
                <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-indigo" />
                <div className="flex-1">
                  <p className="text-sm text-indigo">
                    <span className="font-medium">{t('savedNotice')}</span>
                    {' - '}
                    {t('generatedAt', { date: new Date(existingCoverLetter.created_at).toLocaleString() })}
                  </p>
                  <p className="mt-1 text-xs text-indigo">
                    {t('regenerateHint')}
                  </p>
                </div>
              </div>
            )}

            {/* Job Info */}
            <Card>
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-ink">
                      {result.job.title}
                    </h3>
                    <p className="text-sm text-ink-2">{result.job.company}</p>
                  </div>
                  <Badge tone="ghost" plain>
                    {result.coverLetter.wordCount} {t('wordCount')}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Highlights */}
            {result.coverLetter.highlights.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{t('highlights')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {result.coverLetter.highlights.map((highlight, index) => (
                      <li
                        key={index}
                        className="flex items-start gap-2 text-sm text-ink-2"
                      >
                        <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-sage" />
                        {highlight}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Cover Letter Content */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{t('content')}</CardTitle>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleCopy}
                      className="gap-1"
                    >
                      {copied ? (
                        <>
                          <Check className="h-4 w-4" />
                          {tCommon('copied')}
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4" />
                          {tCommon('copy')}
                        </>
                      )}
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleDownload}
                      className="gap-1"
                    >
                      <Download className="h-4 w-4" />
                      {tCommon('download')}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="whitespace-pre-wrap rounded-lg border border-line bg-surface-2 p-6 leading-relaxed text-ink-2">
                  {result.coverLetter.content}
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex gap-4 justify-between">
              <Button
                variant="secondary"
                onClick={() => setResult(null)}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                {t('regenerate')}
              </Button>
              <Link href={`/jobs/${params.id}`}>
                <Button variant="primary">{t('done')}</Button>
              </Link>
            </div>
          </div>
        )}
    </div>
  )
}
