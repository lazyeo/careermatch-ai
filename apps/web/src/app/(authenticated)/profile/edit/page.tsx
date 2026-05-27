'use client'

/**
 * 个人资料编辑页面
 *
 * 完整的资料编辑器，支持所有子资源的CRUD操作
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle, Button, fieldControlClasses } from '@careermatch/ui'
import type {
  FullProfile,
  UserProfile,
  ProfileWorkExperience,
  EducationRecord,
  UserSkill,
  UserProject,
  UserCertification,
} from '@careermatch/shared'

// 基本信息表单
function BasicInfoForm({
  profile,
  onSave,
  isSaving,
}: {
  profile: UserProfile | null
  onSave: (data: Partial<UserProfile>) => void
  isSaving: boolean
}) {
  const t = useTranslations('profile')
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _tc = useTranslations('common')

  const [formData, setFormData] = useState({
    full_name: profile?.full_name || '',
    email: profile?.email || '',
    phone: profile?.phone || '',
    location: profile?.location || '',
    linkedin_url: profile?.linkedin_url || '',
    github_url: profile?.github_url || '',
    website_url: profile?.website_url || '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-ink-2">
            {t('fullName')} <span className="text-clay">*</span>
          </label>
          <input
            type="text"
            value={formData.full_name}
            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
            className={fieldControlClasses}
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-ink-2">
            {t('email')} <span className="text-clay">*</span>
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className={fieldControlClasses}
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-ink-2">{t('phone')}</label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className={fieldControlClasses}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-ink-2">{t('location')}</label>
          <input
            type="text"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            className={fieldControlClasses}
            placeholder={t('edit.placeholders.location')}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-ink-2">{t('linkedin')}</label>
          <input
            type="url"
            value={formData.linkedin_url}
            onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
            className={fieldControlClasses}
            placeholder={t('edit.placeholders.linkedinUrl')}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-ink-2">{t('github')}</label>
          <input
            type="url"
            value={formData.github_url}
            onChange={(e) => setFormData({ ...formData, github_url: e.target.value })}
            className={fieldControlClasses}
            placeholder={t('edit.placeholders.githubUrl')}
          />
        </div>
        <div className="md:col-span-2">
          <label className="mb-1 block text-xs font-medium text-ink-2">{t('website')}</label>
          <input
            type="url"
            value={formData.website_url}
            onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
            className={fieldControlClasses}
            placeholder={t('edit.placeholders.websiteUrl')}
          />
        </div>
      </div>
      <div className="mt-4 flex justify-end">
        <Button type="submit" disabled={isSaving}>
          {isSaving ? t('edit.savingStatus') : t('edit.saveBasicInfo')}
        </Button>
      </div>
    </form>
  )
}

// 职业摘要表单
function SummaryForm({
  profile,
  onSave,
  isSaving,
}: {
  profile: UserProfile | null
  onSave: (data: Partial<UserProfile>) => void
  isSaving: boolean
}) {
  const t = useTranslations('profile')

  const [summary, setSummary] = useState(profile?.professional_summary || '')
  const [targetRoles, setTargetRoles] = useState(profile?.target_roles?.join(', ') || '')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      professional_summary: summary,
      target_roles: targetRoles.split(',').map((r) => r.trim()).filter(Boolean),
    })
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-ink-2">{t('professionalSummary')}</label>
          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            rows={4}
            className={`${fieldControlClasses} min-h-28 py-2`}
            placeholder={t('edit.placeholders.professionalSummary')}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-ink-2">{t('targetRoles')}</label>
          <input
            type="text"
            value={targetRoles}
            onChange={(e) => setTargetRoles(e.target.value)}
            className={fieldControlClasses}
            placeholder={t('edit.placeholders.targetRoles')}
          />
        </div>
      </div>
      <div className="mt-4 flex justify-end">
        <Button type="submit" disabled={isSaving}>
          {isSaving ? t('edit.savingStatus') : t('edit.saveSummary')}
        </Button>
      </div>
    </form>
  )
}

// 工作经历列表
function WorkExperienceList({
  items,
  onAdd,
  onEdit,
  onDelete,
}: {
  items: ProfileWorkExperience[]
  onAdd: () => void
  onEdit: (item: ProfileWorkExperience) => void
  onDelete: (id: string) => void
}) {
  const t = useTranslations('profile.edit')

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <div key={item.id} className="rounded-lg border border-line bg-surface-2 p-4">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-medium text-ink">{item.position}</h4>
              <p className="text-sm text-ink-2">{item.company}</p>
              <p className="text-xs text-ink-3">
                {item.start_date} - {item.is_current ? t('work.current') : item.end_date}
                {item.location && ` · ${item.location}`}
              </p>
              {item.description && (
                <p className="mt-2 text-sm text-ink-2">{item.description}</p>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => onEdit(item)}
                className="text-sm text-brick hover:text-brick-ink"
              >
                {t('work.editWork')}
              </button>
              <button
                onClick={() => onDelete(item.id)}
                className="text-sm text-clay hover:text-clay"
              >
                {t('work.deleteWork')}
              </button>
            </div>
          </div>
        </div>
      ))}
      <Button variant="outline" onClick={onAdd} className="w-full">
        + {t('work.addWork')}
      </Button>
    </div>
  )
}

// 教育背景列表
function EducationList({
  items,
  onAdd,
  onEdit,
  onDelete,
}: {
  items: EducationRecord[]
  onAdd: () => void
  onEdit: (item: EducationRecord) => void
  onDelete: (id: string) => void
}) {
  const t = useTranslations('profile.edit')

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <div key={item.id} className="rounded-lg border border-line bg-surface-2 p-4">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-medium text-ink">{item.institution}</h4>
              <p className="text-sm text-ink-2">{item.degree} · {item.major}</p>
              <p className="text-xs text-ink-3">
                {item.start_date} - {item.is_current ? t('education.current') : item.end_date}
                {item.gpa && ` · GPA: ${item.gpa}`}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => onEdit(item)}
                className="text-sm text-brick hover:text-brick-ink"
              >
                {t('education.editEducation')}
              </button>
              <button
                onClick={() => onDelete(item.id)}
                className="text-sm text-clay hover:text-clay"
              >
                {t('education.deleteEducation')}
              </button>
            </div>
          </div>
        </div>
      ))}
      <Button variant="outline" onClick={onAdd} className="w-full">
        + {t('education.addEducation')}
      </Button>
    </div>
  )
}

// 技能列表
function SkillsList({
  items,
  onAdd,
  onDelete,
}: {
  items: UserSkill[]
  onAdd: () => void
  onDelete: (id: string) => void
}) {
  const t = useTranslations('profile.edit')

  const levelLabels: Record<string, string> = {
    beginner: t('skills.levels.beginner'),
    intermediate: t('skills.levels.intermediate'),
    advanced: t('skills.levels.advanced'),
    expert: t('skills.levels.expert'),
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <div
            key={item.id}
            className="inline-flex items-center gap-2 rounded-full bg-brick-soft px-3 py-1 text-sm text-brick-ink"
          >
            <span>{item.name}</span>
            {item.level && (
              <span className="text-xs text-brick">({levelLabels[item.level] || item.level})</span>
            )}
            <button
              onClick={() => onDelete(item.id)}
              className="text-brick hover:text-clay"
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <Button variant="outline" onClick={onAdd} size="sm">
        + {t('skills.addSkill')}
      </Button>
    </div>
  )
}

// 项目列表
function ProjectsList({
  items,
  onAdd,
  onEdit,
  onDelete,
}: {
  items: UserProject[]
  onAdd: () => void
  onEdit: (item: UserProject) => void
  onDelete: (id: string) => void
}) {
  const t = useTranslations('profile.edit')

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <div key={item.id} className="rounded-lg border border-line bg-surface-2 p-4">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-medium text-ink">{item.name}</h4>
              {item.role && <p className="text-sm text-ink-2">{item.role}</p>}
              <p className="mt-1 text-sm text-ink-2">{item.description}</p>
              {item.technologies.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {item.technologies.map((tech, i) => (
                    <span key={i} className="rounded bg-sage-soft px-2 py-0.5 text-xs text-sage">
                      {tech}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => onEdit(item)}
                className="text-sm text-brick hover:text-brick-ink"
              >
                {t('projects.editProject')}
              </button>
              <button
                onClick={() => onDelete(item.id)}
                className="text-sm text-clay hover:text-clay"
              >
                {t('projects.deleteProject')}
              </button>
            </div>
          </div>
        </div>
      ))}
      <Button variant="outline" onClick={onAdd} className="w-full">
        + {t('projects.addProject')}
      </Button>
    </div>
  )
}

// 证书列表
function CertificationsList({
  items,
  onAdd,
  onDelete,
}: {
  items: UserCertification[]
  onAdd: () => void
  onDelete: (id: string) => void
}) {
  const t = useTranslations('profile.edit')

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <div key={item.id} className="rounded-lg border border-line bg-surface-2 p-4">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-medium text-ink">{item.name}</h4>
              <p className="text-sm text-ink-2">{item.issuer}</p>
              <p className="text-xs text-ink-3">
                {t('certifications.issueDate')}: {item.issue_date}
                {item.expiry_date && ` · ${t('certifications.expiryDate')}: ${item.expiry_date}`}
              </p>
            </div>
            <button
              onClick={() => onDelete(item.id)}
              className="text-sm text-clay hover:text-clay"
            >
              {t('certifications.deleteCertification')}
            </button>
          </div>
        </div>
      ))}
      <Button variant="outline" onClick={onAdd} className="w-full">
        + {t('certifications.addCertification')}
      </Button>
    </div>
  )
}

export default function ProfileEditPage() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _router = useRouter()
  const t = useTranslations('profile.edit')
  const tc = useTranslations('common')

  const [profile, setProfile] = useState<FullProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 获取完整资料
  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch('/api/profile')
        if (!res.ok) throw new Error('Failed to fetch profile')
        const data = await res.json()
        setProfile(data)
      } catch (err) {
        setError(t('loadingError'))
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [t])

  // 保存基本信息
  const handleSaveBasic = async (data: Partial<UserProfile>) => {
    setSaving(true)
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to save')
      const updated = await res.json()
      setProfile((prev) => prev ? { ...prev, profile: updated } : null)
    } catch (err) {
      setError(t('saveError'))
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  // 删除工作经历
  const handleDeleteWork = async (id: string) => {
    if (!confirm(t('work.confirmDelete'))) return
    try {
      const res = await fetch(`/api/profile/work/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      setProfile((prev) =>
        prev ? { ...prev, work_experiences: prev.work_experiences?.filter((w) => w.id !== id) || [] } : null
      )
    } catch (err) {
      setError(t('deleteError'))
      console.error(err)
    }
  }

  // 删除教育背景
  const handleDeleteEducation = async (id: string) => {
    if (!confirm(t('education.confirmDelete'))) return
    try {
      const res = await fetch(`/api/profile/education/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      setProfile((prev) =>
        prev ? { ...prev, education_records: prev.education_records?.filter((e) => e.id !== id) || [] } : null
      )
    } catch (err) {
      setError(t('deleteError'))
      console.error(err)
    }
  }

  // 删除技能
  const handleDeleteSkill = async (id: string) => {
    try {
      const res = await fetch(`/api/profile/skills/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      setProfile((prev) =>
        prev ? { ...prev, skills: prev.skills?.filter((s) => s.id !== id) || [] } : null
      )
    } catch (err) {
      setError(t('deleteError'))
      console.error(err)
    }
  }

  // 删除项目
  const handleDeleteProject = async (id: string) => {
    if (!confirm(t('projects.confirmDelete'))) return
    try {
      const res = await fetch(`/api/profile/projects/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      setProfile((prev) =>
        prev ? { ...prev, projects: prev.projects?.filter((p) => p.id !== id) || [] } : null
      )
    } catch (err) {
      setError(t('deleteError'))
      console.error(err)
    }
  }

  // 删除证书
  const handleDeleteCertification = async (id: string) => {
    if (!confirm(t('certifications.confirmDelete'))) return
    try {
      const res = await fetch(`/api/profile/certifications/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      setProfile((prev) =>
        prev ? { ...prev, certifications: prev.certifications?.filter((c) => c.id !== id) || [] } : null
      )
    } catch (err) {
      setError(t('deleteError'))
      console.error(err)
    }
  }

  // 添加占位函数（后续可实现弹窗表单）
  const handleAddWork = () => alert(t('developingFeatures.addWork'))
  const handleEditWork = (item: ProfileWorkExperience) => alert(t('developingFeatures.editWork', { position: item.position }))
  const handleAddEducation = () => alert(t('developingFeatures.addEducation'))
  const handleEditEducation = (item: EducationRecord) => alert(t('developingFeatures.editEducation', { institution: item.institution }))
  const handleAddSkill = () => alert(t('developingFeatures.addSkill'))
  const handleAddProject = () => alert(t('developingFeatures.addProject'))
  const handleEditProject = (item: UserProject) => alert(t('developingFeatures.editProject', { name: item.name }))
  const handleAddCertification = () => alert(t('developingFeatures.addCertification'))

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-brick"></div>
          <p className="mt-4 text-ink-2">{tc('loading')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-paper">
      <header className="sticky top-0 z-10 border-b border-line bg-surface/95 backdrop-blur">
        <div className="mx-auto max-w-4xl px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <Link href="/profile" className="text-sm text-ink-3 hover:text-ink">
                ← {t('backToProfile')}
              </Link>
            </div>
            <div className="text-left sm:text-right">
              <p className="cm-eyebrow">{t('sections.basicInfo')}</p>
              <h1 className="font-display text-2xl font-semibold text-ink">{t('title')}</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-4 rounded-lg border border-clay/30 bg-clay-soft p-4 text-sm text-clay">
            {error}
            <button onClick={() => setError(null)} className="ml-2 text-clay">×</button>
          </div>
        )}

        <div className="space-y-6">
          {/* 基本信息 */}
          <Card id="basic">
            <CardHeader>
              <CardTitle>{t('sections.basicInfo')}</CardTitle>
            </CardHeader>
            <CardContent>
              <BasicInfoForm
                profile={profile?.profile || null}
                onSave={handleSaveBasic}
                isSaving={saving}
              />
            </CardContent>
          </Card>

          {/* 职业摘要 */}
          <Card id="summary">
            <CardHeader>
              <CardTitle>{t('sections.summary')}</CardTitle>
            </CardHeader>
            <CardContent>
              <SummaryForm
                profile={profile?.profile || null}
                onSave={handleSaveBasic}
                isSaving={saving}
              />
            </CardContent>
          </Card>

          {/* 工作经历 */}
          <Card id="work">
            <CardHeader>
              <CardTitle>{t('sections.workExperience')}</CardTitle>
            </CardHeader>
            <CardContent>
              <WorkExperienceList
                items={profile?.work_experiences || []}
                onAdd={handleAddWork}
                onEdit={handleEditWork}
                onDelete={handleDeleteWork}
              />
            </CardContent>
          </Card>

          {/* 教育背景 */}
          <Card id="education">
            <CardHeader>
              <CardTitle>{t('sections.education')}</CardTitle>
            </CardHeader>
            <CardContent>
              <EducationList
                items={profile?.education_records || []}
                onAdd={handleAddEducation}
                onEdit={handleEditEducation}
                onDelete={handleDeleteEducation}
              />
            </CardContent>
          </Card>

          {/* 技能 */}
          <Card id="skills">
            <CardHeader>
              <CardTitle>{t('sections.skills')}</CardTitle>
            </CardHeader>
            <CardContent>
              <SkillsList
                items={profile?.skills || []}
                onAdd={handleAddSkill}
                onDelete={handleDeleteSkill}
              />
            </CardContent>
          </Card>

          {/* 项目经历 */}
          <Card id="projects">
            <CardHeader>
              <CardTitle>{t('sections.projects')}</CardTitle>
            </CardHeader>
            <CardContent>
              <ProjectsList
                items={profile?.projects || []}
                onAdd={handleAddProject}
                onEdit={handleEditProject}
                onDelete={handleDeleteProject}
              />
            </CardContent>
          </Card>

          {/* 证书 */}
          <Card id="certifications">
            <CardHeader>
              <CardTitle>{t('sections.certifications')}</CardTitle>
            </CardHeader>
            <CardContent>
              <CertificationsList
                items={profile?.certifications || []}
                onAdd={handleAddCertification}
                onDelete={handleDeleteCertification}
              />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
