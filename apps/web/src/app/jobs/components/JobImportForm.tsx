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
  parsed_data: ParsedJobData
  job_id?: string
  message?: string
  error?: string
}

export function JobImportForm() {
  const router = useRouter()
  const [mode, setMode] = useState<ImportMode>('url')
  const [url, setUrl] = useState('')
  const [content, setContent] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [parsedData, setParsedData] = useState<ParsedJobData | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // 解析岗位
  const handleParse = async () => {
    setIsLoading(true)
    setError(null)
    setParsedData(null)

    try {
      const response = await fetch('/api/jobs/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          mode === 'url' ? { url } : { content }
        ),
      })

      const result: ParsedJobResult = await response.json()

      if (!response.ok) {
        throw new Error(result.error || '解析失败')
      }

      if (result.parsed_data) {
        setParsedData(result.parsed_data)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '解析失败')
    } finally {
      setIsLoading(false)
    }
  }

  // 保存岗位
  const handleSave = async () => {
    if (!parsedData) return

    setIsSaving(true)
    setError(null)

    try {
      const response = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: parsedData.title,
          company: parsedData.company,
          location: parsedData.location,
          job_type: parsedData.job_type,
          salary_min: parsedData.salary_min,
          salary_max: parsedData.salary_max,
          salary_currency: parsedData.salary_currency,
          description: parsedData.description,
          requirements: parsedData.requirements,
          benefits: parsedData.benefits,
          source_url: mode === 'url' ? url : null,
          posted_date: parsedData.posted_date,
          deadline: parsedData.deadline,
          status: 'saved',
        }),
      })

      if (!response.ok) {
        throw new Error('保存失败')
      }

      router.push('/jobs')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败')
    } finally {
      setIsSaving(false)
    }
  }

  // 重置
  const handleReset = () => {
    setParsedData(null)
    setError(null)
    setUrl('')
    setContent('')
  }

  return (
    <div className="space-y-6">
      {/* 导入方式选择 */}
      {!parsedData && (
        <Card>
          <CardHeader>
            <CardTitle>选择导入方式</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 mb-6">
              <button
                onClick={() => setMode('url')}
                className={`flex-1 p-4 rounded-lg border-2 transition-all ${mode === 'url'
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                  }`}
              >
                <div className="text-2xl mb-2">🔗</div>
                <div className="font-medium">URL导入</div>
                <div className="text-sm text-gray-500">
                  粘贴招聘页面链接
                </div>
              </button>
              <button
                onClick={() => setMode('text')}
                className={`flex-1 p-4 rounded-lg border-2 transition-all ${mode === 'text'
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                  }`}
              >
                <div className="text-2xl mb-2">📝</div>
                <div className="font-medium">文本导入</div>
                <div className="text-sm text-gray-500">
                  直接粘贴招聘信息
                </div>
              </button>
            </div>

            {mode === 'url' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  招聘页面URL
                </label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://www.seek.co.nz/job/..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <p className="mt-2 text-sm text-gray-500">
                  支持 Seek、LinkedIn、TradeMe Jobs 等主流招聘平台
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
                disabled={isLoading || (mode === 'url' ? !url : !content)}
              >
                {isLoading ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    AI智能解析中...
                  </>
                ) : (
                  '智能解析'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 解析结果预览 */}
      {parsedData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-success-600">✓</span>
              解析成功 - 请确认信息
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 基本信息 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  岗位标题
                </label>
                <div className="text-lg font-semibold text-gray-900">
                  {parsedData.title || '-'}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  公司名称
                </label>
                <div className="text-lg font-semibold text-gray-900">
                  {parsedData.company || '-'}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  工作地点
                </label>
                <div className="text-gray-900">
                  {parsedData.location || '-'}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  岗位类型
                </label>
                <div className="text-gray-900">
                  {parsedData.job_type
                    ? {
                      'full-time': '全职',
                      'part-time': '兼职',
                      contract: '合同',
                      internship: '实习',
                      casual: '临时',
                    }[parsedData.job_type]
                    : '-'}
                </div>
              </div>
            </div>

            {/* 薪资信息 */}
            {(parsedData.salary_min || parsedData.salary_max) && (
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  薪资范围
                </label>
                <div className="text-lg font-semibold text-success-600">
                  {parsedData.salary_currency || 'NZD'}{' '}
                  {parsedData.salary_min?.toLocaleString() || '?'} -{' '}
                  {parsedData.salary_max?.toLocaleString() || '?'}
                </div>
              </div>
            )}

            {/* 岗位描述 */}
            {parsedData.description && (
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  岗位描述
                </label>
                <div className="text-gray-700 whitespace-pre-wrap bg-gray-50 p-3 rounded-lg max-h-48 overflow-y-auto">
                  {parsedData.description}
                </div>
              </div>
            )}

            {/* 岗位要求 */}
            {parsedData.requirements && (
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  岗位要求
                </label>
                <div className="text-gray-700 whitespace-pre-wrap bg-gray-50 p-3 rounded-lg max-h-48 overflow-y-auto">
                  {parsedData.requirements}
                </div>
              </div>
            )}

            {/* 所需技能 */}
            {parsedData.skills_required &&
              parsedData.skills_required.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-2">
                    所需技能
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {parsedData.skills_required.map((skill, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

            {/* 福利待遇 */}
            {parsedData.benefits && (
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  福利待遇
                </label>
                <div className="text-gray-700 whitespace-pre-wrap bg-gray-50 p-3 rounded-lg">
                  {parsedData.benefits}
                </div>
              </div>
            )}

            {/* 其他信息 */}
            <div className="grid grid-cols-3 gap-4 text-sm">
              {parsedData.experience_years && (
                <div>
                  <span className="text-gray-500">经验要求：</span>
                  <span className="text-gray-900">
                    {parsedData.experience_years}
                  </span>
                </div>
              )}
              {parsedData.education_requirement && (
                <div>
                  <span className="text-gray-500">学历要求：</span>
                  <span className="text-gray-900">
                    {parsedData.education_requirement}
                  </span>
                </div>
              )}
              {parsedData.deadline && (
                <div>
                  <span className="text-gray-500">截止日期：</span>
                  <span className="text-gray-900">{parsedData.deadline}</span>
                </div>
              )}
            </div>

            {error && (
              <div className="p-3 bg-error-50 border border-error-200 text-error-700 rounded-lg">
                {error}
              </div>
            )}

            {/* 操作按钮 */}
            <div className="flex gap-4 justify-end pt-4 border-t">
              <Button variant="outline" onClick={handleReset}>
                重新解析
              </Button>
              <Button
                variant="primary"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? '保存中...' : '保存岗位'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
