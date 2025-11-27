'use client'

/**
 * 简历上传页面
 *
 * 支持上传PDF/Word简历，AI自动解析并填充个人资料
 */

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, Button } from '@careermatch/ui'
import type { ParsedResumeData } from '@careermatch/shared'

// 解析结果预览组件
function ParsedDataPreview({
  data,
  onApply,
  onCancel,
  isApplying,
}: {
  data: ParsedResumeData
  onApply: (sections: Record<string, boolean>) => void
  onCancel: () => void
  isApplying: boolean
}) {
  const [selectedSections, setSelectedSections] = useState({
    personal_info: true,
    work_experiences: true,
    education: true,
    skills: true,
    projects: true,
    certifications: true,
  })

  const toggleSection = (key: keyof typeof selectedSections) => {
    setSelectedSections((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-neutral-900">解析结果预览</h2>
        <p className="text-sm text-neutral-500">选择要导入的部分</p>
      </div>

      {/* 基本信息 */}
      <div className="border rounded-lg overflow-hidden">
        <div
          className={`p-4 cursor-pointer flex items-center justify-between ${
            selectedSections.personal_info ? 'bg-green-50' : 'bg-neutral-50'
          }`}
          onClick={() => toggleSection('personal_info')}
        >
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={selectedSections.personal_info}
              onChange={() => toggleSection('personal_info')}
              className="w-4 h-4 text-primary-600"
            />
            <span className="font-medium">基本信息</span>
          </div>
        </div>
        {selectedSections.personal_info && data.personal_info && (
          <div className="p-4 border-t bg-white">
            <dl className="grid grid-cols-2 gap-2 text-sm">
              {data.personal_info.full_name && (
                <>
                  <dt className="text-neutral-500">姓名</dt>
                  <dd>{data.personal_info.full_name}</dd>
                </>
              )}
              {data.personal_info.email && (
                <>
                  <dt className="text-neutral-500">邮箱</dt>
                  <dd>{data.personal_info.email}</dd>
                </>
              )}
              {data.personal_info.phone && (
                <>
                  <dt className="text-neutral-500">电话</dt>
                  <dd>{data.personal_info.phone}</dd>
                </>
              )}
              {data.personal_info.location && (
                <>
                  <dt className="text-neutral-500">地点</dt>
                  <dd>{data.personal_info.location}</dd>
                </>
              )}
            </dl>
            {data.personal_info.professional_summary && (
              <div className="mt-3">
                <dt className="text-sm text-neutral-500 mb-1">职业摘要</dt>
                <dd className="text-sm bg-neutral-50 p-2 rounded">
                  {data.personal_info.professional_summary}
                </dd>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 工作经历 */}
      {data.work_experiences && data.work_experiences.length > 0 && (
        <div className="border rounded-lg overflow-hidden">
          <div
            className={`p-4 cursor-pointer flex items-center justify-between ${
              selectedSections.work_experiences ? 'bg-green-50' : 'bg-neutral-50'
            }`}
            onClick={() => toggleSection('work_experiences')}
          >
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={selectedSections.work_experiences}
                onChange={() => toggleSection('work_experiences')}
                className="w-4 h-4 text-primary-600"
              />
              <span className="font-medium">工作经历 ({data.work_experiences.length})</span>
            </div>
          </div>
          {selectedSections.work_experiences && (
            <div className="divide-y">
              {data.work_experiences.map((work, i) => (
                <div key={i} className="p-4 bg-white">
                  <div className="font-medium">{work.position}</div>
                  <div className="text-sm text-neutral-600">{work.company}</div>
                  <div className="text-xs text-neutral-500">
                    {work.start_date} - {work.is_current ? '至今' : work.end_date}
                  </div>
                  {work.description && (
                    <p className="mt-2 text-sm text-neutral-700">{work.description}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 教育背景 */}
      {data.education && data.education.length > 0 && (
        <div className="border rounded-lg overflow-hidden">
          <div
            className={`p-4 cursor-pointer flex items-center justify-between ${
              selectedSections.education ? 'bg-green-50' : 'bg-neutral-50'
            }`}
            onClick={() => toggleSection('education')}
          >
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={selectedSections.education}
                onChange={() => toggleSection('education')}
                className="w-4 h-4 text-primary-600"
              />
              <span className="font-medium">教育背景 ({data.education.length})</span>
            </div>
          </div>
          {selectedSections.education && (
            <div className="divide-y">
              {data.education.map((edu, i) => (
                <div key={i} className="p-4 bg-white">
                  <div className="font-medium">{edu.institution}</div>
                  <div className="text-sm text-neutral-600">
                    {edu.degree} · {edu.major}
                  </div>
                  <div className="text-xs text-neutral-500">
                    {edu.start_date} - {edu.is_current ? '至今' : edu.end_date}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 技能 */}
      {data.skills && data.skills.length > 0 && (
        <div className="border rounded-lg overflow-hidden">
          <div
            className={`p-4 cursor-pointer flex items-center justify-between ${
              selectedSections.skills ? 'bg-green-50' : 'bg-neutral-50'
            }`}
            onClick={() => toggleSection('skills')}
          >
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={selectedSections.skills}
                onChange={() => toggleSection('skills')}
                className="w-4 h-4 text-primary-600"
              />
              <span className="font-medium">技能 ({data.skills.length})</span>
            </div>
          </div>
          {selectedSections.skills && (
            <div className="p-4 bg-white">
              <div className="flex flex-wrap gap-2">
                {data.skills.map((skill, i) => (
                  <span
                    key={i}
                    className="px-2 py-1 bg-primary-50 text-primary-700 rounded-full text-sm"
                  >
                    {skill.name}
                    {skill.level && (
                      <span className="text-primary-400 ml-1">
                        ({skill.level})
                      </span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 项目 */}
      {data.projects && data.projects.length > 0 && (
        <div className="border rounded-lg overflow-hidden">
          <div
            className={`p-4 cursor-pointer flex items-center justify-between ${
              selectedSections.projects ? 'bg-green-50' : 'bg-neutral-50'
            }`}
            onClick={() => toggleSection('projects')}
          >
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={selectedSections.projects}
                onChange={() => toggleSection('projects')}
                className="w-4 h-4 text-primary-600"
              />
              <span className="font-medium">项目 ({data.projects.length})</span>
            </div>
          </div>
          {selectedSections.projects && (
            <div className="divide-y">
              {data.projects.map((project, i) => (
                <div key={i} className="p-4 bg-white">
                  <div className="font-medium">{project.name}</div>
                  {project.role && (
                    <div className="text-sm text-neutral-600">{project.role}</div>
                  )}
                  <p className="mt-1 text-sm text-neutral-700">{project.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 证书 */}
      {data.certifications && data.certifications.length > 0 && (
        <div className="border rounded-lg overflow-hidden">
          <div
            className={`p-4 cursor-pointer flex items-center justify-between ${
              selectedSections.certifications ? 'bg-green-50' : 'bg-neutral-50'
            }`}
            onClick={() => toggleSection('certifications')}
          >
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={selectedSections.certifications}
                onChange={() => toggleSection('certifications')}
                className="w-4 h-4 text-primary-600"
              />
              <span className="font-medium">证书 ({data.certifications.length})</span>
            </div>
          </div>
          {selectedSections.certifications && (
            <div className="divide-y">
              {data.certifications.map((cert, i) => (
                <div key={i} className="p-4 bg-white">
                  <div className="font-medium">{cert.name}</div>
                  <div className="text-sm text-neutral-600">{cert.issuer}</div>
                  <div className="text-xs text-neutral-500">{cert.issue_date}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 操作按钮 */}
      <div className="flex gap-4">
        <Button
          onClick={() => onApply(selectedSections)}
          disabled={isApplying}
          className="flex-1"
        >
          {isApplying ? '导入中...' : '导入到资料'}
        </Button>
        <Button variant="outline" onClick={onCancel} disabled={isApplying}>
          取消
        </Button>
      </div>
    </div>
  )
}

export default function ResumeUploadPage() {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [applying, setApplying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [uploadId, setUploadId] = useState<string | null>(null)
  const [parsedData, setParsedData] = useState<ParsedResumeData | null>(null)

  // 处理文件拖拽
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  // 处理文件放置
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0]
      validateAndSetFile(droppedFile)
    }
  }, [])

  // 处理文件选择
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0])
    }
  }

  // 验证文件
  const validateAndSetFile = (file: File) => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
    ]
    const maxSize = 10 * 1024 * 1024 // 10MB

    if (!allowedTypes.includes(file.type)) {
      setError('请上传 PDF、Word 或 TXT 格式的文件')
      return
    }

    if (file.size > maxSize) {
      setError('文件大小不能超过 10MB')
      return
    }

    setError(null)
    setFile(file)
    // 清除之前的解析结果
    setParsedData(null)
    setUploadId(null)
  }

  // 上传并解析
  const handleUpload = async () => {
    if (!file) return

    setUploading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/resume-upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || '上传失败')
      }

      const data = await response.json()
      setUploadId(data.id)
      setParsedData(data.parsed_data)
    } catch (err) {
      setError(err instanceof Error ? err.message : '上传失败，请重试')
      console.error(err)
    } finally {
      setUploading(false)
    }
  }

  // 应用解析结果到资料
  const handleApply = async (sections: Record<string, boolean>) => {
    if (!uploadId) return

    setApplying(true)
    setError(null)

    try {
      const response = await fetch(`/api/resume-upload/${uploadId}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sections_to_apply: sections,
          merge_strategy: 'replace',
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || '导入失败')
      }

      // 成功后跳转到资料页
      router.push('/profile?imported=true')
    } catch (err) {
      setError(err instanceof Error ? err.message : '导入失败，请重试')
      console.error(err)
    } finally {
      setApplying(false)
    }
  }

  // 取消导入
  const handleCancel = () => {
    setParsedData(null)
    setUploadId(null)
    setFile(null)
  }

  // 获取文件类型图标
  const getFileIcon = (file: File) => {
    if (file.type === 'application/pdf') {
      return (
        <svg className="w-12 h-12 text-red-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
        </svg>
      )
    }
    return (
      <svg className="w-12 h-12 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
      </svg>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* 顶部导航 */}
      <header className="bg-white border-b border-neutral-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/profile" className="text-neutral-600 hover:text-neutral-900">
                ← 返回资料中心
              </Link>
            </div>
            <h1 className="text-lg font-semibold text-neutral-900">上传简历</h1>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {parsedData ? (
          // 显示解析结果预览
          <Card>
            <CardContent className="p-6">
              <ParsedDataPreview
                data={parsedData}
                onApply={handleApply}
                onCancel={handleCancel}
                isApplying={applying}
              />
            </CardContent>
          </Card>
        ) : (
          // 显示上传界面
          <Card>
            <CardHeader>
              <CardTitle>从现有简历导入</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-neutral-600 mb-6">
                上传您的简历文件，AI 将自动提取信息并填充到您的个人资料中。
                您可以在导入前预览和修改提取的内容。
              </p>

              {/* 文件上传区域 */}
              <div
                className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive
                    ? 'border-primary-500 bg-primary-50'
                    : file
                    ? 'border-green-500 bg-green-50'
                    : 'border-neutral-300 hover:border-neutral-400'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.txt"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />

                {file ? (
                  <div className="flex flex-col items-center">
                    {getFileIcon(file)}
                    <p className="mt-2 font-medium text-neutral-900">{file.name}</p>
                    <p className="text-sm text-neutral-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        setFile(null)
                      }}
                      className="mt-2 text-sm text-red-600 hover:text-red-700"
                    >
                      移除文件
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <svg
                      className="w-12 h-12 text-neutral-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                    <p className="mt-2 text-sm text-neutral-600">
                      <span className="font-medium text-primary-600">点击上传</span> 或将文件拖拽到此处
                    </p>
                    <p className="mt-1 text-xs text-neutral-500">
                      支持 PDF、Word、TXT 格式，最大 10MB
                    </p>
                  </div>
                )}
              </div>

              {error && (
                <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div className="mt-6 flex gap-4">
                <Button
                  onClick={handleUpload}
                  disabled={!file || uploading}
                  className="flex-1"
                >
                  {uploading ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                      AI 解析中...
                    </>
                  ) : (
                    '上传并解析'
                  )}
                </Button>
              </div>

              {/* 提示信息 */}
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h4 className="text-sm font-medium text-blue-900 mb-2">
                  AI 将主动挖掘以下信息：
                </h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• 基本信息（姓名、联系方式、社交链接等）</li>
                  <li>• 工作经历（公司、职位、时间、成就、技术栈）</li>
                  <li>• 教育背景（学校、学位、专业、荣誉）</li>
                  <li>• 技能清单（技术技能、软技能、语言能力）</li>
                  <li>• 项目经历（项目、角色、亮点）</li>
                  <li>• 证书资质</li>
                  <li>• 其他有价值信息（志愿者经历、发表内容等）</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 手动输入提示 */}
        {!parsedData && (
          <div className="mt-6 text-center">
            <p className="text-sm text-neutral-500">
              没有现成的简历？
              <Link href="/profile/edit" className="text-primary-600 hover:text-primary-700 ml-1">
                手动填写资料
              </Link>
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
