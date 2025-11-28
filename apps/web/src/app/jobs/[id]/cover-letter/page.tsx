'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@careermatch/ui'
import { ArrowLeft, Loader2, FileText, Copy, Download, Check } from 'lucide-react'
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Link href={`/jobs/${params.id}`}>
              <Button variant="ghost" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                {t('backToJob')}
              </Button>
            </Link>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary-600" />
                <h1 className="text-xl font-bold text-gray-900">
                  {t('title')}
                </h1>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                {t('subtitle')}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading && !result ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary-600 mb-4" />
                <p className="text-gray-600">加载中...</p>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('toneStyle')}
                </label>
                <div className="flex gap-3">
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
                      className={`flex-1 p-4 rounded-lg border-2 transition-all text-left ${
                        tone === option.value
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-medium">{option.label}</div>
                      <div className="text-sm text-gray-500">{option.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Language Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('language')}
                </label>
                <div className="flex gap-3">
                  {[
                    { value: 'en', label: t('languages.en'), desc: t('languages.enDesc') },
                    { value: 'zh', label: t('languages.zh'), desc: t('languages.zhDesc') },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setLanguage(option.value as 'en' | 'zh')}
                      className={`flex-1 p-4 rounded-lg border-2 transition-all text-left ${
                        language === option.value
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-medium">{option.label}</div>
                      <div className="text-sm text-gray-500">{option.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <div className="p-3 bg-error-50 border border-error-200 text-error-700 rounded-lg">
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
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {t('generating')}
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4" />
                      {t('generate')}
                    </>
                  )}
                </Button>
              </div>

              <p className="text-sm text-gray-500 text-center">
                {t('ensureProfile')}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* 已保存提示 */}
            {existingCoverLetter && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                <Check className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-blue-900">
                    <span className="font-medium">已保存的求职信</span>
                    {' - '}
                    生成于 {new Date(existingCoverLetter.created_at).toLocaleString()}
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    点击"重新生成"可以创建新的版本
                  </p>
                </div>
              </div>
            )}

            {/* Job Info */}
            <Card>
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {result.job.title}
                    </h3>
                    <p className="text-sm text-gray-600">{result.job.company}</p>
                  </div>
                  <div className="text-sm text-gray-500">
                    {result.coverLetter.wordCount} {t('wordCount')}
                  </div>
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
                        className="flex items-start gap-2 text-sm text-gray-700"
                      >
                        <Check className="w-4 h-4 text-success-600 mt-0.5 flex-shrink-0" />
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
                      variant="outline"
                      size="sm"
                      onClick={handleCopy}
                      className="gap-1"
                    >
                      {copied ? (
                        <>
                          <Check className="w-4 h-4" />
                          {tCommon('copied')}
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          {tCommon('copy')}
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDownload}
                      className="gap-1"
                    >
                      <Download className="w-4 h-4" />
                      {tCommon('download')}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 rounded-lg p-6 whitespace-pre-wrap text-gray-800 leading-relaxed">
                  {result.coverLetter.content}
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex gap-4 justify-between">
              <Button
                variant="outline"
                onClick={() => setResult(null)}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                {t('regenerate')}
              </Button>
              <Link href={`/jobs/${params.id}`}>
                <Button variant="primary">{t('done')}</Button>
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
