'use client'

import { useState, useEffect } from 'react'
import { Button, Card, CardContent } from '@careermatch/ui'
import { useRouter } from 'next/navigation'

interface Resume {
  id: string
  title?: string
  full_name: string
  updated_at: string
}

interface ApplyJobButtonProps {
  jobId: string
}

export function ApplyJobButton({ jobId }: ApplyJobButtonProps) {
  const [showModal, setShowModal] = useState(false)
  const [resumes, setResumes] = useState<Resume[]>([])
  const [selectedResumeId, setSelectedResumeId] = useState<string>('')
  const [notes, setNotes] = useState('')
  const [status, setStatus] = useState<'draft' | 'submitted'>('submitted')
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  // Fetch resumes when modal opens
  useEffect(() => {
    if (showModal && resumes.length === 0) {
      fetchResumes()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showModal])

  const fetchResumes = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/resumes')
      if (!response.ok) throw new Error('获取简历列表失败')
      const data = await response.json()
      setResumes(data)
      if (data.length > 0) {
        setSelectedResumeId(data[0].id)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取简历失败')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!selectedResumeId) {
      setError('请选择一份简历')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobId,
          resumeId: selectedResumeId,
          status,
          notes,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || '创建申请失败')
      }

      const application = await response.json()

      // Redirect to application detail page
      router.push(`/applications/${application.id}`)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建申请失败')
      setIsSubmitting(false)
    }
  }

  return (
    <>
      {/* Trigger Card */}
      <Card className="bg-gradient-to-br from-green-50 to-blue-50 border-green-200">
        <CardContent className="py-12">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 mb-4">
              <svg
                className="w-6 h-6 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">申请此岗位</h3>
            <p className="text-sm text-gray-600 max-w-md mx-auto mb-6">
              选择一份简历并创建申请记录，开始追踪您的求职进度
            </p>
            <Button
              variant="primary"
              onClick={() => setShowModal(true)}
              className="gap-2 bg-green-600 hover:bg-green-700"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              创建申请
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">创建申请记录</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-4 space-y-6">
              {error && (
                <div className="rounded-md bg-red-50 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg
                        className="h-5 w-5 text-red-400"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">{error}</h3>
                    </div>
                  </div>
                </div>
              )}

              {/* Resume Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  选择简历 *
                </label>
                {isLoading ? (
                  <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                    <p className="text-sm text-gray-500 mt-2">加载简历...</p>
                  </div>
                ) : resumes.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-4">您还没有创建简历</p>
                    <Button
                      variant="primary"
                      onClick={() => router.push('/resumes/new')}
                    >
                      创建简历
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {resumes.map((resume) => (
                      <label
                        key={resume.id}
                        className={`flex items-start p-4 border rounded-lg cursor-pointer transition-colors ${
                          selectedResumeId === resume.id
                            ? 'border-primary-600 bg-primary-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="resume"
                          value={resume.id}
                          checked={selectedResumeId === resume.id}
                          onChange={(e) => setSelectedResumeId(e.target.value)}
                          className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                        />
                        <div className="ml-3 flex-1">
                          <div className="font-medium text-gray-900">
                            {resume.title || resume.full_name}
                          </div>
                          <div className="text-sm text-gray-500 mt-1">
                            更新于{' '}
                            {new Date(resume.updated_at).toLocaleDateString('zh-CN')}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  申请状态
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as 'draft' | 'submitted')}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="draft">草稿</option>
                  <option value="submitted">已提交</option>
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  备注（可选）
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  placeholder="添加申请相关的备注信息..."
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowModal(false)}
                disabled={isSubmitting}
              >
                取消
              </Button>
              <Button
                variant="primary"
                onClick={handleSubmit}
                disabled={isSubmitting || !selectedResumeId || isLoading}
                className="bg-green-600 hover:bg-green-700"
              >
                {isSubmitting ? '创建中...' : '创建申请'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
