'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@careermatch/ui'
import { Download, Edit, Save, ArrowLeft, Printer } from 'lucide-react'

interface ResumeData {
  id: string
  title: string
  content: {
    personal_info?: {
      full_name?: string
      email?: string
      phone?: string
      location?: string
      linkedin?: string
      github?: string
      website?: string
    }
    professional_summary?: string
    work_experience?: Array<{
      company: string
      position: string
      location?: string
      start_date: string
      end_date: string
      achievements?: string[]
    }>
    education?: Array<{
      institution: string
      degree: string
      field: string
      location?: string
      start_date: string
      end_date: string
      gpa?: string
      honors?: string[]
    }>
    skills?: {
      technical?: string[]
      soft?: string[]
      languages?: string[]
      tools?: string[]
    }
    projects?: Array<{
      name: string
      role?: string
      description: string
      technologies?: string[]
      achievements?: string[]
      url?: string
    }>
    certifications?: Array<{
      name: string
      issuer: string
      date: string
      credential_id?: string
    }>
  }
  created_at: string
  updated_at: string
}

interface ResumePreviewProps {
  resume: ResumeData
}

export function ResumePreview({ resume }: ResumePreviewProps) {
  const router = useRouter()
  const [isSaving, setIsSaving] = useState(false)
  const content = resume.content

  const handlePrint = () => {
    window.print()
  }

  const handleExportPDF = async () => {
    setIsSaving(true)
    try {
      const response = await fetch(`/api/resumes/${resume.id}/export-pdf`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to export PDF')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${resume.title}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error exporting PDF:', error)
      alert('导出PDF失败，请重试')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Toolbar - 不打印 */}
      <div className="print:hidden bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={() => router.push('/resumes')}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                返回列表
              </Button>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">
                  {resume.title}
                </h1>
                <p className="text-sm text-gray-500">
                  AI生成的简历 · 可直接打印
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handlePrint} className="gap-2">
                <Printer className="w-4 h-4" />
                打印
              </Button>
              <Button
                variant="outline"
                onClick={handleExportPDF}
                disabled={isSaving}
                className="gap-2"
              >
                <Download className="w-4 h-4" />
                {isSaving ? '导出中...' : '导出PDF'}
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push(`/resumes/${resume.id}/edit`)}
                className="gap-2"
              >
                <Edit className="w-4 h-4" />
                编辑
              </Button>
              <Button variant="primary" className="gap-2">
                <Save className="w-4 h-4" />
                保存
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* A4 Paper Preview */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 print:p-0">
        <div className="bg-white shadow-lg print:shadow-none mx-auto" style={{ maxWidth: '210mm' }}>
          {/* A4 Content - 210mm × 297mm */}
          <div
            className="p-12 print:p-16"
            style={{
              minHeight: '297mm',
              fontSize: '11pt',
              lineHeight: '1.5',
            }}
          >
            {/* Header - Personal Info */}
            {content.personal_info && (
              <div className="mb-8 border-b-2 border-gray-800 pb-4">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {content.personal_info.full_name || 'Your Name'}
                </h1>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
                  {content.personal_info.email && (
                    <span>📧 {content.personal_info.email}</span>
                  )}
                  {content.personal_info.phone && (
                    <span>📱 {content.personal_info.phone}</span>
                  )}
                  {content.personal_info.location && (
                    <span>📍 {content.personal_info.location}</span>
                  )}
                  {content.personal_info.linkedin && (
                    <span>🔗 {content.personal_info.linkedin}</span>
                  )}
                  {content.personal_info.github && (
                    <span>💻 {content.personal_info.github}</span>
                  )}
                  {content.personal_info.website && (
                    <span>🌐 {content.personal_info.website}</span>
                  )}
                </div>
              </div>
            )}

            {/* Professional Summary */}
            {content.professional_summary && (
              <section className="mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-3 border-b border-gray-300 pb-1">
                  Professional Summary
                </h2>
                <p className="text-gray-700">{content.professional_summary}</p>
              </section>
            )}

            {/* Work Experience */}
            {content.work_experience && content.work_experience.length > 0 && (
              <section className="mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-3 border-b border-gray-300 pb-1">
                  Work Experience
                </h2>
                <div className="space-y-4">
                  {content.work_experience.map((exp, index) => (
                    <div key={index}>
                      <div className="flex justify-between items-baseline mb-1">
                        <div>
                          <h3 className="font-bold text-gray-900">
                            {exp.position}
                          </h3>
                          <p className="text-gray-700">
                            {exp.company}
                            {exp.location && `, ${exp.location}`}
                          </p>
                        </div>
                        <span className="text-sm text-gray-600 whitespace-nowrap ml-4">
                          {exp.start_date} - {exp.end_date}
                        </span>
                      </div>
                      {exp.achievements && exp.achievements.length > 0 && (
                        <ul className="list-disc list-outside ml-5 mt-2 space-y-1">
                          {exp.achievements.map((achievement, idx) => (
                            <li key={idx} className="text-gray-700">
                              {achievement}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Education */}
            {content.education && content.education.length > 0 && (
              <section className="mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-3 border-b border-gray-300 pb-1">
                  Education
                </h2>
                <div className="space-y-3">
                  {content.education.map((edu, index) => (
                    <div key={index}>
                      <div className="flex justify-between items-baseline">
                        <div>
                          <h3 className="font-bold text-gray-900">
                            {edu.degree} in {edu.field}
                          </h3>
                          <p className="text-gray-700">
                            {edu.institution}
                            {edu.location && `, ${edu.location}`}
                          </p>
                          {edu.gpa && (
                            <p className="text-sm text-gray-600">GPA: {edu.gpa}</p>
                          )}
                        </div>
                        <span className="text-sm text-gray-600 whitespace-nowrap ml-4">
                          {edu.start_date} - {edu.end_date}
                        </span>
                      </div>
                      {edu.honors && edu.honors.length > 0 && (
                        <p className="text-sm text-gray-600 mt-1">
                          Honors: {edu.honors.join(', ')}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Skills */}
            {content.skills && (
              <section className="mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-3 border-b border-gray-300 pb-1">
                  Skills
                </h2>
                <div className="space-y-2">
                  {content.skills.technical && content.skills.technical.length > 0 && (
                    <div>
                      <span className="font-semibold text-gray-900">
                        Technical:{' '}
                      </span>
                      <span className="text-gray-700">
                        {content.skills.technical.join(', ')}
                      </span>
                    </div>
                  )}
                  {content.skills.tools && content.skills.tools.length > 0 && (
                    <div>
                      <span className="font-semibold text-gray-900">
                        Tools & Frameworks:{' '}
                      </span>
                      <span className="text-gray-700">
                        {content.skills.tools.join(', ')}
                      </span>
                    </div>
                  )}
                  {content.skills.soft && content.skills.soft.length > 0 && (
                    <div>
                      <span className="font-semibold text-gray-900">
                        Soft Skills:{' '}
                      </span>
                      <span className="text-gray-700">
                        {content.skills.soft.join(', ')}
                      </span>
                    </div>
                  )}
                  {content.skills.languages && content.skills.languages.length > 0 && (
                    <div>
                      <span className="font-semibold text-gray-900">
                        Languages:{' '}
                      </span>
                      <span className="text-gray-700">
                        {content.skills.languages.join(', ')}
                      </span>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Projects */}
            {content.projects && content.projects.length > 0 && (
              <section className="mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-3 border-b border-gray-300 pb-1">
                  Projects
                </h2>
                <div className="space-y-3">
                  {content.projects.map((project, index) => (
                    <div key={index}>
                      <div className="flex justify-between items-baseline mb-1">
                        <h3 className="font-bold text-gray-900">
                          {project.name}
                          {project.role && ` - ${project.role}`}
                        </h3>
                        {project.url && (
                          <span className="text-sm text-blue-600 ml-4">
                            {project.url}
                          </span>
                        )}
                      </div>
                      <p className="text-gray-700 mb-1">{project.description}</p>
                      {project.technologies && project.technologies.length > 0 && (
                        <p className="text-sm text-gray-600 mb-1">
                          <span className="font-semibold">Technologies: </span>
                          {project.technologies.join(', ')}
                        </p>
                      )}
                      {project.achievements && project.achievements.length > 0 && (
                        <ul className="list-disc list-outside ml-5 space-y-1">
                          {project.achievements.map((achievement, idx) => (
                            <li key={idx} className="text-gray-700">
                              {achievement}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Certifications */}
            {content.certifications && content.certifications.length > 0 && (
              <section className="mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-3 border-b border-gray-300 pb-1">
                  Certifications
                </h2>
                <div className="space-y-2">
                  {content.certifications.map((cert, index) => (
                    <div key={index} className="flex justify-between">
                      <div>
                        <span className="font-semibold text-gray-900">
                          {cert.name}
                        </span>
                        <span className="text-gray-700"> - {cert.issuer}</span>
                        {cert.credential_id && (
                          <span className="text-sm text-gray-600">
                            {' '}
                            (ID: {cert.credential_id})
                          </span>
                        )}
                      </div>
                      <span className="text-sm text-gray-600 whitespace-nowrap ml-4">
                        {cert.date}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
