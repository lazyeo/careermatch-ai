'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@careermatch/ui'
import { Download, Edit, Save, ArrowLeft, Printer, Palette } from 'lucide-react'
import type { TemplateConfig } from '@careermatch/shared'

// 简化类型定义
interface ResumeData {
  id: string
  title: string
  content: Record<string, unknown>
  template_id?: string
  created_at: string
  updated_at: string
}

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
  templateConfig: TemplateConfig
  templateName: string
}

interface NormalizedPersonalInfo {
  fullName?: string
  email?: string
  phone?: string
  location?: string
  linkedIn?: string
  github?: string
  website?: string
}

// 规范化函数
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

export function ResumePreview({ resume, templateConfig, templateName }: ResumePreviewProps) {
  const router = useRouter()
  const [isSaving, setIsSaving] = useState(false)
  const rawContent = resume.content

  // 规范化内容
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

  const rawSkills = rawContent.skills
  const skills = Array.isArray(rawSkills) ? (rawSkills as NormalizedSkill[]) : null
  const skillsObject = !Array.isArray(rawSkills) && rawSkills ? (rawSkills as SkillsObject) : null

  // 从模板配置生成CSS变量
  const { colors, fonts, spacing, layout } = templateConfig
  const isTwoColumn = layout === 'two-column'

  const cssVariables = {
    '--color-primary': colors.primary,
    '--color-secondary': colors.secondary || colors.primary,
    '--color-text': colors.text,
    '--color-text-light': colors.textLight,
    '--color-background': colors.background,
    '--color-accent': colors.accent,
    '--font-heading': fonts.heading.includes('Times') ? 'Georgia, serif' : 'system-ui, sans-serif',
    '--font-body': fonts.body.includes('Courier') ? 'monospace' : fonts.body.includes('Times') ? 'Georgia, serif' : 'system-ui, sans-serif',
    '--font-heading-size': `${fonts.headingSize + 6}pt`,
    '--font-body-size': `${fonts.bodySize + 1}pt`,
    '--spacing-section': `${spacing.sectionGap * 1.5}px`,
    '--spacing-item': `${spacing.itemGap}px`,
    '--line-height': spacing.lineHeight.toString(),
  } as React.CSSProperties

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
      alert('Export PDF failed, please try again')
    } finally {
      setIsSaving(false)
    }
  }

  // 单栏布局
  const renderSingleColumn = () => (
    <div
      className="p-12 print:p-16"
      style={{
        minHeight: '297mm',
        fontSize: 'var(--font-body-size)',
        lineHeight: 'var(--line-height)',
        fontFamily: 'var(--font-body)',
        color: 'var(--color-text)',
        backgroundColor: 'var(--color-background)',
      }}
    >
      {/* Header */}
      {personalInfo && (
        <div
          className="mb-8 pb-4"
          style={{ borderBottom: `3px solid var(--color-primary)` }}
        >
          <h1
            className="mb-2"
            style={{
              fontSize: 'calc(var(--font-heading-size) + 8pt)',
              fontFamily: 'var(--font-heading)',
              fontWeight: 700,
              color: 'var(--color-text)',
            }}
          >
            {personalInfo.fullName || 'Your Name'}
          </h1>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm" style={{ color: 'var(--color-text-light)' }}>
            {personalInfo.email && <span>{personalInfo.email}</span>}
            {personalInfo.phone && <span>{personalInfo.phone}</span>}
            {personalInfo.location && <span>{personalInfo.location}</span>}
            {personalInfo.linkedIn && <span>{personalInfo.linkedIn}</span>}
            {personalInfo.github && <span>{personalInfo.github}</span>}
          </div>
        </div>
      )}

      {/* Summary */}
      {summary && (
        <section style={{ marginBottom: 'var(--spacing-section)' }}>
          <h2
            className="mb-3 pb-1"
            style={{
              fontSize: 'var(--font-heading-size)',
              fontFamily: 'var(--font-heading)',
              fontWeight: 700,
              color: 'var(--color-primary)',
              borderBottom: `1px solid var(--color-accent)`,
            }}
          >
            Professional Summary
          </h2>
          <p>{summary}</p>
        </section>
      )}

      {/* Skills */}
      {skills && skills.length > 0 && (
        <section style={{ marginBottom: 'var(--spacing-section)' }}>
          <h2
            className="mb-3 pb-1"
            style={{
              fontSize: 'var(--font-heading-size)',
              fontFamily: 'var(--font-heading)',
              fontWeight: 700,
              color: 'var(--color-primary)',
              borderBottom: `1px solid var(--color-accent)`,
            }}
          >
            Skills
          </h2>
          <div className="flex flex-wrap gap-2">
            {skills.map((skill, index) => (
              <span
                key={index}
                className="px-3 py-1 rounded-full text-sm"
                style={{
                  backgroundColor: 'var(--color-accent)',
                  color: 'var(--color-text)',
                }}
              >
                {skill.name}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Skills Object Format */}
      {skillsObject && (
        <section style={{ marginBottom: 'var(--spacing-section)' }}>
          <h2
            className="mb-3 pb-1"
            style={{
              fontSize: 'var(--font-heading-size)',
              fontFamily: 'var(--font-heading)',
              fontWeight: 700,
              color: 'var(--color-primary)',
              borderBottom: `1px solid var(--color-accent)`,
            }}
          >
            Skills
          </h2>
          <div className="space-y-2">
            {skillsObject.technical && skillsObject.technical.length > 0 && (
              <div>
                <span className="font-semibold" style={{ color: 'var(--color-primary)' }}>Technical: </span>
                <span>{skillsObject.technical.join(', ')}</span>
              </div>
            )}
            {skillsObject.tools && skillsObject.tools.length > 0 && (
              <div>
                <span className="font-semibold" style={{ color: 'var(--color-primary)' }}>Tools: </span>
                <span>{skillsObject.tools.join(', ')}</span>
              </div>
            )}
            {skillsObject.soft && skillsObject.soft.length > 0 && (
              <div>
                <span className="font-semibold" style={{ color: 'var(--color-primary)' }}>Soft Skills: </span>
                <span>{skillsObject.soft.join(', ')}</span>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Work Experience */}
      {workExperience.length > 0 && (
        <section style={{ marginBottom: 'var(--spacing-section)' }}>
          <h2
            className="mb-3 pb-1"
            style={{
              fontSize: 'var(--font-heading-size)',
              fontFamily: 'var(--font-heading)',
              fontWeight: 700,
              color: 'var(--color-primary)',
              borderBottom: `1px solid var(--color-accent)`,
            }}
          >
            Work Experience
          </h2>
          <div className="space-y-4">
            {workExperience.map((exp, index) => (
              <div key={index} style={{ marginBottom: 'var(--spacing-item)' }}>
                <div className="flex justify-between items-baseline mb-1">
                  <div>
                    <h3 className="font-bold" style={{ fontFamily: 'var(--font-heading)' }}>
                      {exp.position}
                    </h3>
                    <p style={{ color: 'var(--color-text-light)' }}>
                      {exp.company}{exp.location && `, ${exp.location}`}
                    </p>
                  </div>
                  <span className="text-sm whitespace-nowrap ml-4" style={{ color: 'var(--color-text-light)' }}>
                    {exp.startDate} - {exp.isCurrent ? 'Present' : exp.endDate}
                  </span>
                </div>
                {exp.description && <p className="mt-1">{exp.description}</p>}
                {exp.achievements && exp.achievements.length > 0 && (
                  <ul className="list-disc list-outside ml-5 mt-2 space-y-1">
                    {exp.achievements.map((achievement, idx) => (
                      <li key={idx}>{achievement}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Projects */}
      {projects.length > 0 && (
        <section style={{ marginBottom: 'var(--spacing-section)' }}>
          <h2
            className="mb-3 pb-1"
            style={{
              fontSize: 'var(--font-heading-size)',
              fontFamily: 'var(--font-heading)',
              fontWeight: 700,
              color: 'var(--color-primary)',
              borderBottom: `1px solid var(--color-accent)`,
            }}
          >
            Projects
          </h2>
          <div className="space-y-3">
            {projects.map((project, index) => (
              <div key={index} style={{ marginBottom: 'var(--spacing-item)' }}>
                <div className="flex justify-between items-baseline mb-1">
                  <h3 className="font-bold" style={{ fontFamily: 'var(--font-heading)' }}>
                    {project.name}{project.role && ` - ${project.role}`}
                  </h3>
                  {project.url && (
                    <span className="text-sm ml-4" style={{ color: 'var(--color-primary)' }}>
                      {project.url}
                    </span>
                  )}
                </div>
                {project.description && <p className="mb-1">{project.description}</p>}
                {project.technologies && project.technologies.length > 0 && (
                  <p className="text-sm" style={{ color: 'var(--color-primary)' }}>
                    {project.technologies.join(' · ')}
                  </p>
                )}
                {project.highlights && project.highlights.length > 0 && (
                  <ul className="list-disc list-outside ml-5 mt-1 space-y-1">
                    {project.highlights.map((highlight, idx) => (
                      <li key={idx}>{highlight}</li>
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
        <section style={{ marginBottom: 'var(--spacing-section)' }}>
          <h2
            className="mb-3 pb-1"
            style={{
              fontSize: 'var(--font-heading-size)',
              fontFamily: 'var(--font-heading)',
              fontWeight: 700,
              color: 'var(--color-primary)',
              borderBottom: `1px solid var(--color-accent)`,
            }}
          >
            Education
          </h2>
          <div className="space-y-3">
            {education.map((edu, index) => (
              <div key={index}>
                <div className="flex justify-between items-baseline">
                  <div>
                    <h3 className="font-bold" style={{ fontFamily: 'var(--font-heading)' }}>
                      {edu.degree}{edu.major && ` in ${edu.major}`}
                    </h3>
                    <p style={{ color: 'var(--color-text-light)' }}>
                      {edu.institution}{edu.location && `, ${edu.location}`}
                    </p>
                    {edu.gpa && <p className="text-sm">GPA: {edu.gpa}</p>}
                  </div>
                  {(edu.startDate || edu.endDate) && (
                    <span className="text-sm whitespace-nowrap ml-4" style={{ color: 'var(--color-text-light)' }}>
                      {edu.endDate || 'Present'}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Certifications */}
      {certifications.length > 0 && (
        <section>
          <h2
            className="mb-3 pb-1"
            style={{
              fontSize: 'var(--font-heading-size)',
              fontFamily: 'var(--font-heading)',
              fontWeight: 700,
              color: 'var(--color-primary)',
              borderBottom: `1px solid var(--color-accent)`,
            }}
          >
            Certifications
          </h2>
          <div className="space-y-2">
            {certifications.map((cert, index) => (
              <div key={index} className="flex justify-between">
                <div>
                  <span className="font-medium">{cert.name}</span>
                  {cert.issuer && <span style={{ color: 'var(--color-text-light)' }}> - {cert.issuer}</span>}
                </div>
                {cert.issueDate && (
                  <span className="text-sm" style={{ color: 'var(--color-text-light)' }}>
                    {cert.issueDate}
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )

  // 双栏布局
  const renderTwoColumn = () => (
    <div
      className="flex print:flex"
      style={{
        minHeight: '297mm',
        fontSize: 'var(--font-body-size)',
        lineHeight: 'var(--line-height)',
        fontFamily: 'var(--font-body)',
      }}
    >
      {/* Left Sidebar - 35% */}
      <div
        className="w-[35%] p-6"
        style={{
          backgroundColor: 'var(--color-secondary)',
          color: '#FFFFFF',
        }}
      >
        {/* Name */}
        {personalInfo && (
          <div className="mb-6 pb-4 border-b border-white/30">
            <h1
              className="text-center"
              style={{
                fontSize: 'calc(var(--font-heading-size) + 4pt)',
                fontFamily: 'var(--font-heading)',
                fontWeight: 700,
              }}
            >
              {personalInfo.fullName || 'Your Name'}
            </h1>
          </div>
        )}

        {/* Contact */}
        {personalInfo && (
          <div className="mb-6">
            <h3 className="text-xs uppercase tracking-wider mb-3 font-semibold opacity-90">Contact</h3>
            <div className="space-y-2 text-sm opacity-90">
              {personalInfo.email && <p>{personalInfo.email}</p>}
              {personalInfo.phone && <p>{personalInfo.phone}</p>}
              {personalInfo.location && <p>{personalInfo.location}</p>}
              {personalInfo.linkedIn && <p>{personalInfo.linkedIn}</p>}
              {personalInfo.github && <p>{personalInfo.github}</p>}
            </div>
          </div>
        )}

        {/* Skills in Sidebar */}
        {skills && skills.length > 0 && (
          <div className="mb-6">
            <h3 className="text-xs uppercase tracking-wider mb-3 font-semibold opacity-90">Skills</h3>
            <div className="space-y-1 text-sm">
              {skills.map((skill, index) => (
                <p key={index} className="pl-2">{skill.name}</p>
              ))}
            </div>
          </div>
        )}

        {/* Certifications in Sidebar */}
        {certifications.length > 0 && (
          <div>
            <h3 className="text-xs uppercase tracking-wider mb-3 font-semibold opacity-90">Certifications</h3>
            <div className="space-y-2 text-sm">
              {certifications.map((cert, index) => (
                <div key={index}>
                  <p className="font-medium">{cert.name}</p>
                  {cert.issuer && <p className="text-xs opacity-70">{cert.issuer}</p>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Right Main Content - 65% */}
      <div
        className="w-[65%] p-8"
        style={{
          backgroundColor: 'var(--color-background)',
          color: 'var(--color-text)',
        }}
      >
        {/* Summary */}
        {summary && (
          <section style={{ marginBottom: 'var(--spacing-section)' }}>
            <h2
              className="mb-3 pb-1"
              style={{
                fontSize: 'var(--font-heading-size)',
                fontFamily: 'var(--font-heading)',
                fontWeight: 700,
                color: 'var(--color-primary)',
                borderBottom: `2px solid var(--color-accent)`,
              }}
            >
              Professional Summary
            </h2>
            <p>{summary}</p>
          </section>
        )}

        {/* Work Experience */}
        {workExperience.length > 0 && (
          <section style={{ marginBottom: 'var(--spacing-section)' }}>
            <h2
              className="mb-3 pb-1"
              style={{
                fontSize: 'var(--font-heading-size)',
                fontFamily: 'var(--font-heading)',
                fontWeight: 700,
                color: 'var(--color-primary)',
                borderBottom: `2px solid var(--color-accent)`,
              }}
            >
              Experience
            </h2>
            <div className="space-y-4">
              {workExperience.map((exp, index) => (
                <div key={index} style={{ marginBottom: 'var(--spacing-item)' }}>
                  <div className="flex justify-between items-baseline mb-1">
                    <h3 className="font-bold" style={{ fontFamily: 'var(--font-heading)' }}>
                      {exp.position}
                    </h3>
                    <span className="text-sm" style={{ color: 'var(--color-text-light)' }}>
                      {exp.startDate} - {exp.isCurrent ? 'Present' : exp.endDate}
                    </span>
                  </div>
                  <p className="mb-1" style={{ color: 'var(--color-text-light)' }}>{exp.company}</p>
                  {exp.achievements && exp.achievements.length > 0 && (
                    <ul className="list-disc list-outside ml-5 space-y-1">
                      {exp.achievements.map((achievement, idx) => (
                        <li key={idx}>{achievement}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Projects */}
        {projects.length > 0 && (
          <section style={{ marginBottom: 'var(--spacing-section)' }}>
            <h2
              className="mb-3 pb-1"
              style={{
                fontSize: 'var(--font-heading-size)',
                fontFamily: 'var(--font-heading)',
                fontWeight: 700,
                color: 'var(--color-primary)',
                borderBottom: `2px solid var(--color-accent)`,
              }}
            >
              Projects
            </h2>
            <div className="space-y-3">
              {projects.map((project, index) => (
                <div key={index}>
                  <h3 className="font-bold" style={{ fontFamily: 'var(--font-heading)' }}>
                    {project.name}
                  </h3>
                  {project.description && <p className="text-sm mb-1">{project.description}</p>}
                  {project.technologies && project.technologies.length > 0 && (
                    <p className="text-sm" style={{ color: 'var(--color-primary)' }}>
                      {project.technologies.join(' · ')}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Education */}
        {education.length > 0 && (
          <section>
            <h2
              className="mb-3 pb-1"
              style={{
                fontSize: 'var(--font-heading-size)',
                fontFamily: 'var(--font-heading)',
                fontWeight: 700,
                color: 'var(--color-primary)',
                borderBottom: `2px solid var(--color-accent)`,
              }}
            >
              Education
            </h2>
            <div className="space-y-2">
              {education.map((edu, index) => (
                <div key={index} className="flex justify-between items-baseline">
                  <div>
                    <h3 className="font-bold" style={{ fontFamily: 'var(--font-heading)' }}>
                      {edu.degree}{edu.major && ` in ${edu.major}`}
                    </h3>
                    <p style={{ color: 'var(--color-text-light)' }}>{edu.institution}</p>
                  </div>
                  {edu.endDate && (
                    <span className="text-sm" style={{ color: 'var(--color-text-light)' }}>
                      {edu.endDate}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Toolbar */}
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
                Back
              </Button>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">
                  {resume.title}
                </h1>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Palette className="w-3 h-3" />
                  <span>Template: {templateName}</span>
                  <span>·</span>
                  <span>{isTwoColumn ? 'Two Column' : 'Single Column'}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handlePrint} className="gap-2">
                <Printer className="w-4 h-4" />
                Print
              </Button>
              <Button
                variant="outline"
                onClick={handleExportPDF}
                disabled={isSaving}
                className="gap-2"
              >
                <Download className="w-4 h-4" />
                {isSaving ? 'Exporting...' : 'Export PDF'}
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push(`/resumes/${resume.id}/edit`)}
                className="gap-2"
              >
                <Edit className="w-4 h-4" />
                Edit
              </Button>
              <Button variant="primary" className="gap-2">
                <Save className="w-4 h-4" />
                Save
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* A4 Paper Preview */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 print:p-0">
        <div
          className="bg-white shadow-lg print:shadow-none mx-auto overflow-hidden"
          style={{ ...cssVariables, maxWidth: '210mm' }}
        >
          {isTwoColumn ? renderTwoColumn() : renderSingleColumn()}
        </div>
      </div>
    </div>
  )
}
