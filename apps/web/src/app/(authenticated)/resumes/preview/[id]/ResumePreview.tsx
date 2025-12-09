'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@careermatch/ui'
import { Download, Edit, Save, ArrowLeft, Printer } from 'lucide-react'

// 简化类型定义 - 使用 Record 来支持两种格式
interface ResumeData {
  id: string
  title: string
  content: Record<string, unknown>
  created_at: string
  updated_at: string
}

// 规范化的数据类型
interface NormalizedWorkExp {
  company: string
  position: string
  location?: string
  startDate?: string
  endDate?: string
  isCurrent?: boolean
  description?: string
  achievements?: string[]
}

interface NormalizedEducation {
  institution: string
  degree: string
  major?: string
  location?: string
  startDate?: string
  endDate?: string
  gpa?: string
  achievements?: string[]
}

interface NormalizedProject {
  name: string
  role?: string
  description?: string
  technologies?: string[]
  highlights?: string[]
  url?: string
}

interface NormalizedCertification {
  name: string
  issuer?: string
  issueDate?: string
  credentialId?: string
}

interface NormalizedSkill {
  name: string
  level?: string
  category?: string
}

interface SkillsObject {
  technical?: string[]
  soft?: string[]
  languages?: string[]
  tools?: string[]
}

interface ResumePreviewProps {
  resume: ResumeData
}

// 规范化的个人信息类型
interface NormalizedPersonalInfo {
  fullName?: string
  email?: string
  phone?: string
  location?: string
  linkedIn?: string
  github?: string
  website?: string
}

// 规范化个人信息
function normalizePersonalInfo(info: unknown): NormalizedPersonalInfo | null {
  if (!info || typeof info !== 'object') return null
  const data = info as Record<string, unknown>
  return {
    fullName: (data.fullName || data.full_name) as string | undefined,
    email: data.email as string | undefined,
    phone: data.phone as string | undefined,
    location: data.location as string | undefined,
    linkedIn: (data.linkedIn || data.linkedin) as string | undefined,
    github: data.github as string | undefined,
    website: data.website as string | undefined,
  }
}

// 规范化工作经历
function normalizeWorkExperience(data: unknown[]): NormalizedWorkExp[] {
  return data.map((item) => {
    const exp = item as Record<string, unknown>
    return {
      company: exp.company as string,
      position: exp.position as string,
      location: exp.location as string | undefined,
      startDate: (exp.startDate || exp.start_date) as string | undefined,
      endDate: (exp.endDate || exp.end_date) as string | undefined,
      isCurrent: exp.isCurrent as boolean | undefined,
      description: exp.description as string | undefined,
      achievements: exp.achievements as string[] | undefined,
    }
  })
}

// 规范化教育背景
function normalizeEducation(data: unknown[]): NormalizedEducation[] {
  return data.map((item) => {
    const edu = item as Record<string, unknown>
    return {
      institution: edu.institution as string,
      degree: edu.degree as string,
      major: (edu.major || edu.field) as string | undefined,
      location: edu.location as string | undefined,
      startDate: (edu.startDate || edu.start_date) as string | undefined,
      endDate: (edu.endDate || edu.end_date) as string | undefined,
      gpa: edu.gpa as string | undefined,
      achievements: (edu.achievements || edu.honors) as string[] | undefined,
    }
  })
}

// 规范化项目
function normalizeProjects(data: unknown[]): NormalizedProject[] {
  return data.map((item) => {
    const proj = item as Record<string, unknown>
    return {
      name: proj.name as string,
      role: proj.role as string | undefined,
      description: proj.description as string | undefined,
      technologies: proj.technologies as string[] | undefined,
      highlights: (proj.highlights || proj.achievements) as string[] | undefined,
      url: proj.url as string | undefined,
    }
  })
}

// 规范化证书
function normalizeCertifications(data: unknown[]): NormalizedCertification[] {
  return data.map((item) => {
    const cert = item as Record<string, unknown>
    return {
      name: cert.name as string,
      issuer: cert.issuer as string | undefined,
      issueDate: (cert.issueDate || cert.date || cert.issue_date) as string | undefined,
      credentialId: (cert.credentialId || cert.credential_id) as string | undefined,
    }
  })
}

export function ResumePreview({ resume }: ResumePreviewProps) {
  const router = useRouter()
  const [isSaving, setIsSaving] = useState(false)
  const rawContent = resume.content

  // 规范化内容 - 支持两种格式
  const personalInfo = normalizePersonalInfo(rawContent.personalInfo || rawContent.personal_info)
  const summary = (rawContent.careerObjective || rawContent.professional_summary) as string | undefined
  const rawWorkExp = (rawContent.workExperience || rawContent.work_experience || []) as unknown[]
  const rawEdu = (rawContent.education || []) as unknown[]
  const rawProjects = (rawContent.projects || []) as unknown[]
  const rawCerts = (rawContent.certifications || []) as unknown[]

  const workExperience = normalizeWorkExperience(rawWorkExp)
  const education = normalizeEducation(rawEdu)
  const projects = normalizeProjects(rawProjects)
  const certifications = normalizeCertifications(rawCerts)

  // 处理skills - 可能是数组或对象
  const rawSkills = rawContent.skills
  const skills = Array.isArray(rawSkills) ? (rawSkills as NormalizedSkill[]) : null
  const skillsObject = !Array.isArray(rawSkills) && rawSkills ? (rawSkills as SkillsObject) : null

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
            {personalInfo && (
              <div className="mb-8 border-b-2 border-gray-800 pb-4">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {personalInfo.fullName || 'Your Name'}
                </h1>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
                  {personalInfo.email && (
                    <span>📧 {personalInfo.email}</span>
                  )}
                  {personalInfo.phone && (
                    <span>📱 {personalInfo.phone}</span>
                  )}
                  {personalInfo.location && (
                    <span>📍 {personalInfo.location}</span>
                  )}
                  {personalInfo.linkedIn && (
                    <span>🔗 {personalInfo.linkedIn}</span>
                  )}
                  {personalInfo.github && (
                    <span>💻 {personalInfo.github}</span>
                  )}
                  {personalInfo.website && (
                    <span>🌐 {personalInfo.website}</span>
                  )}
                </div>
              </div>
            )}

            {/* Professional Summary */}
            {summary && (
              <section className="mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-3 border-b border-gray-300 pb-1">
                  Professional Summary
                </h2>
                <p className="text-gray-700">{summary}</p>
              </section>
            )}

            {/* Work Experience */}
            {workExperience.length > 0 && (
              <section className="mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-3 border-b border-gray-300 pb-1">
                  Work Experience
                </h2>
                <div className="space-y-4">
                  {workExperience.map((exp, index) => (
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
                          {exp.startDate} - {exp.isCurrent ? 'Present' : exp.endDate}
                        </span>
                      </div>
                      {exp.description && (
                        <p className="text-gray-700 mt-1">{exp.description}</p>
                      )}
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
            {education.length > 0 && (
              <section className="mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-3 border-b border-gray-300 pb-1">
                  Education
                </h2>
                <div className="space-y-3">
                  {education.map((edu, index) => (
                    <div key={index}>
                      <div className="flex justify-between items-baseline">
                        <div>
                          <h3 className="font-bold text-gray-900">
                            {edu.degree}{edu.major && ` in ${edu.major}`}
                          </h3>
                          <p className="text-gray-700">
                            {edu.institution}
                            {edu.location && `, ${edu.location}`}
                          </p>
                          {edu.gpa && (
                            <p className="text-sm text-gray-600">GPA: {edu.gpa}</p>
                          )}
                        </div>
                        {(edu.startDate || edu.endDate) && (
                          <span className="text-sm text-gray-600 whitespace-nowrap ml-4">
                            {edu.startDate && `${edu.startDate} - `}{edu.endDate || 'Present'}
                          </span>
                        )}
                      </div>
                      {edu.achievements && edu.achievements.length > 0 && (
                        <p className="text-sm text-gray-600 mt-1">
                          Honors: {edu.achievements.join(', ')}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Skills - 数组格式 */}
            {skills && skills.length > 0 && (
              <section className="mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-3 border-b border-gray-300 pb-1">
                  Skills
                </h2>
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                    >
                      {skill.name}
                      {skill.level && ` (${skill.level})`}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* Skills - 对象格式 (旧格式兼容) */}
            {skillsObject && (
              <section className="mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-3 border-b border-gray-300 pb-1">
                  Skills
                </h2>
                <div className="space-y-2">
                  {skillsObject.technical && skillsObject.technical.length > 0 && (
                    <div>
                      <span className="font-semibold text-gray-900">
                        Technical:{' '}
                      </span>
                      <span className="text-gray-700">
                        {skillsObject.technical.join(', ')}
                      </span>
                    </div>
                  )}
                  {skillsObject.tools && skillsObject.tools.length > 0 && (
                    <div>
                      <span className="font-semibold text-gray-900">
                        Tools & Frameworks:{' '}
                      </span>
                      <span className="text-gray-700">
                        {skillsObject.tools.join(', ')}
                      </span>
                    </div>
                  )}
                  {skillsObject.soft && skillsObject.soft.length > 0 && (
                    <div>
                      <span className="font-semibold text-gray-900">
                        Soft Skills:{' '}
                      </span>
                      <span className="text-gray-700">
                        {skillsObject.soft.join(', ')}
                      </span>
                    </div>
                  )}
                  {skillsObject.languages && skillsObject.languages.length > 0 && (
                    <div>
                      <span className="font-semibold text-gray-900">
                        Languages:{' '}
                      </span>
                      <span className="text-gray-700">
                        {skillsObject.languages.join(', ')}
                      </span>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Projects */}
            {projects.length > 0 && (
              <section className="mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-3 border-b border-gray-300 pb-1">
                  Projects
                </h2>
                <div className="space-y-3">
                  {projects.map((project, index) => (
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
                      {project.description && (
                        <p className="text-gray-700 mb-1">{project.description}</p>
                      )}
                      {project.technologies && project.technologies.length > 0 && (
                        <p className="text-sm text-gray-600 mb-1">
                          <span className="font-semibold">Technologies: </span>
                          {project.technologies.join(', ')}
                        </p>
                      )}
                      {project.highlights && project.highlights.length > 0 && (
                        <ul className="list-disc list-outside ml-5 space-y-1">
                          {project.highlights.map((item, idx) => (
                            <li key={idx} className="text-gray-700">
                              {item}
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
            {certifications.length > 0 && (
              <section className="mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-3 border-b border-gray-300 pb-1">
                  Certifications
                </h2>
                <div className="space-y-2">
                  {certifications.map((cert, index) => (
                    <div key={index} className="flex justify-between">
                      <div>
                        <span className="font-semibold text-gray-900">
                          {cert.name}
                        </span>
                        {cert.issuer && (
                          <span className="text-gray-700"> - {cert.issuer}</span>
                        )}
                        {cert.credentialId && (
                          <span className="text-sm text-gray-600">
                            {' '}
                            (ID: {cert.credentialId})
                          </span>
                        )}
                      </div>
                      {cert.issueDate && (
                        <span className="text-sm text-gray-600 whitespace-nowrap ml-4">
                          {cert.issueDate}
                        </span>
                      )}
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
