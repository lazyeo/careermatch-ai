'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@careermatch/ui'
import type { ParsedJobData } from '@careermatch/job-scraper'

type ImportMode = 'url' | 'text'

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
  const [mode, setMode] = useState<ImportMode>('url')
  const [urls, setUrls] = useState('')
  const [content, setContent] = useState('')
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
        throw new Error('未找到有效的URL链接')
      }

      const payload = mode === 'url'
        ? { urls: uniqueUrls }
        : { content }

      const response = await fetch('/api/jobs/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const result: BatchImportResponse = await response.json()

      if (!response.ok) {
        throw new Error(result.error || '解析失败')
      }

      if (result.results) {
        setParsedResults(result.results)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '解析失败')
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
          source_url: originalUrl || (mode === 'url' ? urls.split('\n')[0] : null), // Fallback
          posted_date: data.posted_date,
          deadline: data.deadline,
          status: 'saved',
        }),
      })

      if (!response.ok) {
        throw new Error('保存失败')
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
    setContent('')
  }

  return (
    <div className="space-y-6">
      {/* 导入方式选择 */}
      {parsedResults.length === 0 && (
        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="border-b border-gray-100 pb-4">
            <CardTitle className="text-xl font-semibold text-gray-900">导入岗位</CardTitle>
            <p className="text-sm text-gray-500">
              先抓取岗位原文，再决定是否保存。把输入方式保持在一个入口里，减少重复操作。
            </p>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-1">
              <button
                onClick={() => setMode('url')}
                className={`rounded-md px-4 py-2 text-sm font-medium transition ${mode === 'url'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                链接导入
              </button>
              <button
                onClick={() => setMode('text')}
                className={`rounded-md px-4 py-2 text-sm font-medium transition ${mode === 'text'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                文本导入
              </button>
            </div>

            {mode === 'url' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  招聘页面URL (每行一个)
                </label>
                <textarea
                  value={urls}
                  onChange={(e) => setUrls(e.target.value)}
                  rows={5}
                  placeholder="粘贴包含链接的文本，例如：&#10;https://seek.co.nz/job/123, https://linkedin.com/jobs/..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono text-sm"
                />
                <p className="mt-2 text-sm text-gray-500">
                  支持自动从文本中提取多个链接（支持换行、逗号分隔或混合文本）
                </p>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  招聘信息内容
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={10}
                  placeholder="粘贴完整的招聘信息..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <p className="mt-2 text-sm text-gray-500">
                  从招聘页面复制完整的岗位描述
                </p>
              </div>
            )}

            {error && (
              <div className="mt-4 p-3 bg-error-50 border border-error-200 text-error-700 rounded-lg">
                {error}
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <Button
                onClick={handleParse}
                variant="primary"
                disabled={isLoading || (mode === 'url' ? !urls.trim() : !content.trim())}
              >
                {isLoading ? '解析中...' : '开始解析'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 解析结果预览 */}
      {parsedResults.length > 0 && (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                解析结果 ({parsedResults.filter(r => r.success).length}/{parsedResults.length})
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                先确认岗位质量，再统一保存。低质量或重复内容可以在这里直接放弃。
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={handleReset}>
                重新导入
              </Button>
              <Button
                variant="primary"
                onClick={handleSaveAll}
                disabled={isSaving || parsedResults.filter(r => r.success).length === 0}
              >
                {isSaving ? '保存中...' : '全部保存'}
              </Button>
            </div>
          </div>

          {parsedResults.map((result, index) => (
            <Card key={index} className={result.success ? 'border-gray-200 shadow-sm' : 'border-red-200 shadow-sm'}>
              <CardHeader className="border-b border-gray-100 pb-4">
                <CardTitle className="flex items-center justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${result.success ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                      {result.success ? '解析成功' : '解析失败'}
                    </span>
                    {result.input && (
                      <span className="truncate text-sm font-normal text-gray-500">
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
                        <label className="text-xs text-gray-500">岗位标题</label>
                        <div className="font-medium">{result.parsed_data.title}</div>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">公司名称</label>
                        <div className="font-medium">{result.parsed_data.company}</div>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">地点</label>
                        <div>{result.parsed_data.location || '-'}</div>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">薪资</label>
                        <div className="text-success-600">
                          {result.parsed_data.salary_min
                            ? `${result.parsed_data.salary_currency} ${result.parsed_data.salary_min.toLocaleString()}`
                            : '-'}
                        </div>
                      </div>
                    </div>
                    {/* 简略描述 */}
                    <div>
                      <label className="text-xs text-gray-500">描述预览</label>
                      <div className="text-sm text-gray-600 line-clamp-2">
                        {result.parsed_data.description}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-error-600 text-sm">
                    {result.error || '未知错误'}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
