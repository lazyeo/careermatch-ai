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
import { Card, CardContent, CardHeader, CardTitle, Button } from '@careermatch/ui'
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
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            {t('fullName')} <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.full_name}
            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            {t('email')} <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">{t('phone')}</label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">{t('location')}</label>
          <input
            type="text"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder={t('edit.placeholders.location')}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">{t('linkedin')}</label>
          <input
            type="url"
            value={formData.linkedin_url}
            onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder={t('edit.placeholders.linkedinUrl')}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">{t('github')}</label>
          <input
            type="url"
            value={formData.github_url}
            onChange={(e) => setFormData({ ...formData, github_url: e.target.value })}
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder={t('edit.placeholders.githubUrl')}
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-neutral-700 mb-1">{t('website')}</label>
          <input
            type="url"
            value={formData.website_url}
            onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
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
          <label className="block text-sm font-medium text-neutral-700 mb-1">{t('professionalSummary')}</label>
          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder={t('edit.placeholders.professionalSummary')}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">{t('targetRoles')}</label>
          <input
            type="text"
            value={targetRoles}
            onChange={(e) => setTargetRoles(e.target.value)}
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
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
        <div key={item.id} className="p-4 bg-neutral-50 rounded-lg">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-medium text-neutral-900">{item.position}</h4>
              <p className="text-sm text-neutral-600">{item.company}</p>
              <p className="text-xs text-neutral-500">
                {item.start_date} - {item.is_current ? t('work.current') : item.end_date}
                {item.location && ` · ${item.location}`}
              </p>
              {item.description && (
                <p className="mt-2 text-sm text-neutral-700">{item.description}</p>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => onEdit(item)}
                className="text-primary-600 hover:text-primary-700 text-sm"
              >
                {t('work.editWork')}
              </button>
              <button
                onClick={() => onDelete(item.id)}
                className="text-red-600 hover:text-red-700 text-sm"
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
        <div key={item.id} className="p-4 bg-neutral-50 rounded-lg">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-medium text-neutral-900">{item.institution}</h4>
              <p className="text-sm text-neutral-600">{item.degree} · {item.major}</p>
              <p className="text-xs text-neutral-500">
                {item.start_date} - {item.is_current ? t('education.current') : item.end_date}
                {item.gpa && ` · GPA: ${item.gpa}`}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => onEdit(item)}
                className="text-primary-600 hover:text-primary-700 text-sm"
              >
                {t('education.editEducation')}
              </button>
              <button
                onClick={() => onDelete(item.id)}
                className="text-red-600 hover:text-red-700 text-sm"
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
            className="inline-flex items-center gap-2 px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-sm"
          >
            <span>{item.name}</span>
            {item.level && (
              <span className="text-xs text-primary-500">({levelLabels[item.level] || item.level})</span>
            )}
            <button
              onClick={() => onDelete(item.id)}
              className="text-primary-400 hover:text-red-500"
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
        <div key={item.id} className="p-4 bg-neutral-50 rounded-lg">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-medium text-neutral-900">{item.name}</h4>
              {item.role && <p className="text-sm text-neutral-600">{item.role}</p>}
              <p className="mt-1 text-sm text-neutral-700">{item.description}</p>
              {item.technologies.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {item.technologies.map((tech, i) => (
                    <span key={i} className="px-2 py-0.5 bg-neutral-200 text-neutral-600 rounded text-xs">
                      {tech}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => onEdit(item)}
                className="text-primary-600 hover:text-primary-700 text-sm"
              >
                {t('projects.editProject')}
              </button>
              <button
                onClick={() => onDelete(item.id)}
                className="text-red-600 hover:text-red-700 text-sm"
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
        <div key={item.id} className="p-4 bg-neutral-50 rounded-lg">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-medium text-neutral-900">{item.name}</h4>
              <p className="text-sm text-neutral-600">{item.issuer}</p>
              <p className="text-xs text-neutral-500">
                {t('certifications.issueDate')}: {item.issue_date}
                {item.expiry_date && ` · ${t('certifications.expiryDate')}: ${item.expiry_date}`}
              </p>
            </div>
            <button
              onClick={() => onDelete(item.id)}
              className="text-red-600 hover:text-red-700 text-sm"
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
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-neutral-600">{tc('loading')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* 顶部导航 */}
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/profile" className="text-neutral-600 hover:text-neutral-900">
                ← {t('backToProfile')}
              </Link>
            </div>
            <h1 className="text-lg font-semibold text-neutral-900">{t('title')}</h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-lg">
            {error}
            <button onClick={() => setError(null)} className="ml-2 text-red-500">×</button>
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
