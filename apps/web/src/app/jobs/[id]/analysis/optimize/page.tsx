'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
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

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<OptimizeResponse | null>(null)

  useEffect(() => {
    if (!resumeId || !sessionId) {
      setError('缺少必要参数')
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
          throw new Error(data.error || '优化失败')
        }

        const data = await response.json()
        setResult(data)
      } catch (err) {
        console.error('Optimization error:', err)
        setError(err instanceof Error ? err.message : '优化失败')
      } finally {
        setIsLoading(false)
      }
    }

    fetchOptimization()
  }, [params.id, resumeId, sessionId])

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
        throw new Error('保存失败')
      }

      // Redirect back to analysis page
      router.push(`/jobs/${params.id}/analysis?resumeId=${resumeId}`)
    } catch (err) {
      console.error('Save error:', err)
      setError(err instanceof Error ? err.message : '保存失败')
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
            <h3 className="text-lg font-semibold text-gray-900 mb-2">AI正在优化简历</h3>
            <p className="text-sm text-gray-600">
              正在分析岗位要求并优化简历内容，请稍候...
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
            <h3 className="text-lg font-semibold text-gray-900 mb-2">优化失败</h3>
            <p className="text-sm text-gray-600 mb-4">{error}</p>
            <Link href={`/jobs/${params.id}/analysis?resumeId=${resumeId}`}>
              <Button variant="primary">返回分析页面</Button>
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
                返回分析
              </Button>
            </Link>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary-600" />
                <h1 className="text-xl font-bold text-gray-900">AI简历优化</h1>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                预览AI优化后的简历，确认后应用更改
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
              主要优化内容
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
              <CardTitle className="text-gray-500">原始简历</CardTitle>
            </CardHeader>
            <CardContent>
              <ResumePreview content={result.originalContent} />
            </CardContent>
          </Card>

          {/* Optimized */}
          <Card className="border-primary-200 bg-primary-50/30">
            <CardHeader>
              <CardTitle className="text-primary-700 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                优化后简历
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResumePreview content={result.optimizedContent} isOptimized />
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-end">
          <Link href={`/jobs/${params.id}/analysis?resumeId=${resumeId}`}>
            <Button variant="secondary">取消</Button>
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
                保存中...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                应用优化
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
}: {
  content: ResumeContent
  isOptimized?: boolean
}) {
  const highlightClass = isOptimized ? 'bg-primary-100/50' : ''

  return (
    <div className="space-y-4 text-sm">
      {/* Personal Info */}
      {content.personal_info && (
        <div className={`p-3 rounded ${highlightClass}`}>
          <h4 className="font-semibold text-gray-900">
            {content.personal_info.fullName || '姓名未填写'}
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
          <h5 className="font-medium text-gray-700 mb-1">求职目标</h5>
          <p className="text-gray-600">{content.careerObjective}</p>
        </div>
      )}

      {/* Skills */}
      {content.skills && content.skills.length > 0 && (
        <div className={`p-3 rounded ${highlightClass}`}>
          <h5 className="font-medium text-gray-700 mb-2">技能</h5>
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
          <h5 className="font-medium text-gray-700 mb-2">工作经历</h5>
          {content.workExperience.map((exp, i) => (
            <div key={i} className="mb-3 last:mb-0">
              <p className="font-medium text-gray-800">{exp.position}</p>
              <p className="text-gray-600">
                {exp.company} | {exp.startDate} - {exp.endDate || '至今'}
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
          <h5 className="font-medium text-gray-700 mb-2">项目经验</h5>
          {content.projects.map((proj, i) => (
            <div key={i} className="mb-2 last:mb-0">
              <p className="font-medium text-gray-800">{proj.name}</p>
              {proj.description && (
                <p className="text-gray-500">{proj.description}</p>
              )}
              {proj.technologies && proj.technologies.length > 0 && (
                <p className="text-xs text-gray-400 mt-1">
                  技术栈: {proj.technologies.join(', ')}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Education */}
      {content.education && content.education.length > 0 && (
        <div className={`p-3 rounded ${highlightClass}`}>
          <h5 className="font-medium text-gray-700 mb-2">教育背景</h5>
          {content.education.map((edu, i) => (
            <div key={i} className="mb-2 last:mb-0">
              <p className="font-medium text-gray-800">{edu.school}</p>
              <p className="text-gray-600">
                {edu.degree} {edu.field} | {edu.startDate} - {edu.endDate || '至今'}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
