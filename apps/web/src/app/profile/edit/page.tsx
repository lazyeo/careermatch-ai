'use client'

/**
 * 个人资料编辑页面
 *
 * 完整的资料编辑器，支持所有子资源的CRUD操作
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
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
            姓名 <span className="text-red-500">*</span>
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
            邮箱 <span className="text-red-500">*</span>
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
          <label className="block text-sm font-medium text-neutral-700 mb-1">电话</label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">所在地</label>
          <input
            type="text"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="例如：上海"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">LinkedIn</label>
          <input
            type="url"
            value={formData.linkedin_url}
            onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="https://linkedin.com/in/..."
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">GitHub</label>
          <input
            type="url"
            value={formData.github_url}
            onChange={(e) => setFormData({ ...formData, github_url: e.target.value })}
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="https://github.com/..."
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-neutral-700 mb-1">个人网站</label>
          <input
            type="url"
            value={formData.website_url}
            onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="https://..."
          />
        </div>
      </div>
      <div className="mt-4 flex justify-end">
        <Button type="submit" disabled={isSaving}>
          {isSaving ? '保存中...' : '保存基本信息'}
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
          <label className="block text-sm font-medium text-neutral-700 mb-1">职业摘要</label>
          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="简要描述您的职业背景、核心技能和职业目标..."
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">目标岗位</label>
          <input
            type="text"
            value={targetRoles}
            onChange={(e) => setTargetRoles(e.target.value)}
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="用逗号分隔，如：前端工程师, 全栈开发, 技术经理"
          />
        </div>
      </div>
      <div className="mt-4 flex justify-end">
        <Button type="submit" disabled={isSaving}>
          {isSaving ? '保存中...' : '保存摘要'}
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
  return (
    <div className="space-y-4">
      {items.map((item) => (
        <div key={item.id} className="p-4 bg-neutral-50 rounded-lg">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-medium text-neutral-900">{item.position}</h4>
              <p className="text-sm text-neutral-600">{item.company}</p>
              <p className="text-xs text-neutral-500">
                {item.start_date} - {item.is_current ? '至今' : item.end_date}
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
                编辑
              </button>
              <button
                onClick={() => onDelete(item.id)}
                className="text-red-600 hover:text-red-700 text-sm"
              >
                删除
              </button>
            </div>
          </div>
        </div>
      ))}
      <Button variant="outline" onClick={onAdd} className="w-full">
        + 添加工作经历
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
  return (
    <div className="space-y-4">
      {items.map((item) => (
        <div key={item.id} className="p-4 bg-neutral-50 rounded-lg">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-medium text-neutral-900">{item.institution}</h4>
              <p className="text-sm text-neutral-600">{item.degree} · {item.major}</p>
              <p className="text-xs text-neutral-500">
                {item.start_date} - {item.is_current ? '至今' : item.end_date}
                {item.gpa && ` · GPA: ${item.gpa}`}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => onEdit(item)}
                className="text-primary-600 hover:text-primary-700 text-sm"
              >
                编辑
              </button>
              <button
                onClick={() => onDelete(item.id)}
                className="text-red-600 hover:text-red-700 text-sm"
              >
                删除
              </button>
            </div>
          </div>
        </div>
      ))}
      <Button variant="outline" onClick={onAdd} className="w-full">
        + 添加教育背景
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
  const levelLabels: Record<string, string> = {
    beginner: '入门',
    intermediate: '中级',
    advanced: '高级',
    expert: '精通',
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
        + 添加技能
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
                编辑
              </button>
              <button
                onClick={() => onDelete(item.id)}
                className="text-red-600 hover:text-red-700 text-sm"
              >
                删除
              </button>
            </div>
          </div>
        </div>
      ))}
      <Button variant="outline" onClick={onAdd} className="w-full">
        + 添加项目
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
  return (
    <div className="space-y-4">
      {items.map((item) => (
        <div key={item.id} className="p-4 bg-neutral-50 rounded-lg">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-medium text-neutral-900">{item.name}</h4>
              <p className="text-sm text-neutral-600">{item.issuer}</p>
              <p className="text-xs text-neutral-500">
                获取时间: {item.issue_date}
                {item.expiry_date && ` · 有效期至: ${item.expiry_date}`}
              </p>
            </div>
            <button
              onClick={() => onDelete(item.id)}
              className="text-red-600 hover:text-red-700 text-sm"
            >
              删除
            </button>
          </div>
        </div>
      ))}
      <Button variant="outline" onClick={onAdd} className="w-full">
        + 添加证书
      </Button>
    </div>
  )
}

export default function ProfileEditPage() {
  const router = useRouter()
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
        setError('加载资料失败')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [])

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
      setError('保存失败')
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  // 删除工作经历
  const handleDeleteWork = async (id: string) => {
    if (!confirm('确定要删除这条工作经历吗？')) return
    try {
      const res = await fetch(`/api/profile/work/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      setProfile((prev) =>
        prev ? { ...prev, work_experiences: prev.work_experiences?.filter((w) => w.id !== id) || [] } : null
      )
    } catch (err) {
      setError('删除失败')
      console.error(err)
    }
  }

  // 删除教育背景
  const handleDeleteEducation = async (id: string) => {
    if (!confirm('确定要删除这条教育背景吗？')) return
    try {
      const res = await fetch(`/api/profile/education/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      setProfile((prev) =>
        prev ? { ...prev, education_records: prev.education_records?.filter((e) => e.id !== id) || [] } : null
      )
    } catch (err) {
      setError('删除失败')
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
      setError('删除失败')
      console.error(err)
    }
  }

  // 删除项目
  const handleDeleteProject = async (id: string) => {
    if (!confirm('确定要删除这个项目吗？')) return
    try {
      const res = await fetch(`/api/profile/projects/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      setProfile((prev) =>
        prev ? { ...prev, projects: prev.projects?.filter((p) => p.id !== id) || [] } : null
      )
    } catch (err) {
      setError('删除失败')
      console.error(err)
    }
  }

  // 删除证书
  const handleDeleteCertification = async (id: string) => {
    if (!confirm('确定要删除这个证书吗？')) return
    try {
      const res = await fetch(`/api/profile/certifications/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      setProfile((prev) =>
        prev ? { ...prev, certifications: prev.certifications?.filter((c) => c.id !== id) || [] } : null
      )
    } catch (err) {
      setError('删除失败')
      console.error(err)
    }
  }

  // 添加占位函数（后续可实现弹窗表单）
  const handleAddWork = () => alert('添加工作经历功能开发中...')
  const handleEditWork = (item: ProfileWorkExperience) => alert(`编辑工作经历: ${item.position}`)
  const handleAddEducation = () => alert('添加教育背景功能开发中...')
  const handleEditEducation = (item: EducationRecord) => alert(`编辑教育背景: ${item.institution}`)
  const handleAddSkill = () => alert('添加技能功能开发中...')
  const handleAddProject = () => alert('添加项目功能开发中...')
  const handleEditProject = (item: UserProject) => alert(`编辑项目: ${item.name}`)
  const handleAddCertification = () => alert('添加证书功能开发中...')

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-neutral-600">加载中...</p>
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
                ← 返回资料中心
              </Link>
            </div>
            <h1 className="text-lg font-semibold text-neutral-900">编辑个人资料</h1>
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
              <CardTitle>基本信息</CardTitle>
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
              <CardTitle>职业摘要</CardTitle>
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
              <CardTitle>工作经历</CardTitle>
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
              <CardTitle>教育背景</CardTitle>
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
              <CardTitle>技能</CardTitle>
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
              <CardTitle>项目经历</CardTitle>
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
              <CardTitle>证书</CardTitle>
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
