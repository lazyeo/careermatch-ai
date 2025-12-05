'use client'

import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button, Card, CardContent, CardHeader, CardTitle } from '@careermatch/ui'
import type { ResumeContent } from '@careermatch/shared'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'

// Zod schema for resume validation
const resumeSchema = z.object({
  title: z.string().min(1, '请输入简历标题'),
  personalInfo: z.object({
    fullName: z.string().min(1, '请输入姓名'),
    email: z.string().email('请输入有效的邮箱'),
    phone: z.string().optional(),
    location: z.string().optional(),
    linkedIn: z.string().optional(),
    github: z.string().optional(),
    website: z.string().optional(),
  }),
  careerObjective: z.string().optional(),
  skills: z.array(z.object({
    name: z.string().min(1, '请输入技能名称'),
    level: z.enum(['beginner', 'intermediate', 'expert']).optional(),
    years: z.number().optional(),
    category: z.string().optional(),
  })).default([]),
  workExperience: z.array(z.object({
    id: z.string(),
    company: z.string().min(1, '请输入公司名称'),
    position: z.string().min(1, '请输入职位'),
    location: z.string().optional(),
    startDate: z.string().min(1, '请输入开始日期'),
    endDate: z.string().optional(),
    isCurrent: z.boolean(),
    description: z.string(),
    achievements: z.array(z.string()).default([]),
    technologies: z.array(z.string()).default([]),
  })).default([]),
  projects: z.array(z.object({
    id: z.string(),
    name: z.string().min(1, '请输入项目名称'),
    description: z.string(),
    role: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    technologies: z.array(z.string()).default([]),
    url: z.string().optional(),
    highlights: z.array(z.string()).default([]),
  })).default([]),
  education: z.array(z.object({
    id: z.string(),
    institution: z.string().min(1, '请输入学校名称'),
    degree: z.string().min(1, '请输入学位'),
    major: z.string().min(1, '请输入专业'),
    location: z.string().optional(),
    startDate: z.string().min(1, '请输入开始日期'),
    endDate: z.string().optional(),
    gpa: z.number().optional(),
    achievements: z.array(z.string()).default([]),
  })).default([]),
  certifications: z.array(z.object({
    id: z.string(),
    name: z.string().min(1, '请输入证书名称'),
    issuer: z.string().min(1, '请输入颁发机构'),
    issueDate: z.string().min(1, '请输入颁发日期'),
    expiryDate: z.string().optional(),
    credentialId: z.string().optional(),
    url: z.string().optional(),
  })).default([]),
  interests: z.array(z.string()).default([]),
})

type ResumeFormData = z.infer<typeof resumeSchema>

interface ResumeFormProps {
  initialData?: {
    id?: string
    title: string
    content: ResumeContent
  }
  mode: 'create' | 'edit'
}

export function ResumeForm({ initialData, mode }: ResumeFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResumeFormData>({
    resolver: zodResolver(resumeSchema),
    defaultValues: initialData
      ? {
        title: initialData.title,
        ...initialData.content,
      }
      : {
        title: '我的简历',
        personalInfo: {
          fullName: '',
          email: '',
          phone: '',
          location: '',
          linkedIn: '',
          github: '',
          website: '',
        },
        careerObjective: '',
        skills: [],
        workExperience: [],
        projects: [],
        education: [],
        certifications: [],
        interests: [],
      },
  })

  const {
    fields: skillFields,
    append: appendSkill,
    remove: removeSkill,
  } = useFieldArray({
    control,
    name: 'skills',
  })

  const {
    fields: workFields,
    append: appendWork,
    remove: removeWork,
  } = useFieldArray({
    control,
    name: 'workExperience',
  })

  const {
    fields: eduFields,
    append: appendEdu,
    remove: removeEdu,
  } = useFieldArray({
    control,
    name: 'education',
  })

  const onSubmit = async (data: ResumeFormData) => {
    setIsSubmitting(true)
    setError(null)

    try {
      const { title, ...content } = data

      const payload = {
        title,
        content,
      }

      let response
      if (mode === 'create') {
        response = await fetch('/api/resumes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      } else {
        response = await fetch(`/api/resumes/${initialData?.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      }

      if (!response.ok) {
        throw new Error('Failed to save resume')
      }

      await response.json()
      toast.success(mode === 'create' ? '简历创建成功' : '简历保存成功')
      router.push(`/resumes`)
      router.refresh()
    } catch (err) {
      console.error('Error saving resume:', err)
      const errorMessage = '保存失败，请重试'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Resume Title */}
      <Card>
        <CardHeader>
          <CardTitle>简历标题</CardTitle>
        </CardHeader>
        <CardContent>
          <input
            type="text"
            {...register('title')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="例如：软件工程师简历"
          />
          {errors.title && (
            <p className="text-error-600 text-sm mt-1">{errors.title.message}</p>
          )}
        </CardContent>
      </Card>

      {/* Personal Info */}
      <Card>
        <CardHeader>
          <CardTitle>个人信息</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                姓名 <span className="text-error-600">*</span>
              </label>
              <input
                type="text"
                {...register('personalInfo.fullName')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              {errors.personalInfo?.fullName && (
                <p className="text-error-600 text-sm mt-1">
                  {errors.personalInfo.fullName.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                邮箱 <span className="text-error-600">*</span>
              </label>
              <input
                type="email"
                {...register('personalInfo.email')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              {errors.personalInfo?.email && (
                <p className="text-error-600 text-sm mt-1">
                  {errors.personalInfo.email.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">电话</label>
              <input
                type="tel"
                {...register('personalInfo.phone')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">地点</label>
              <input
                type="text"
                {...register('personalInfo.location')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="例如：Auckland, New Zealand"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn</label>
              <input
                type="url"
                {...register('personalInfo.linkedIn')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="https://linkedin.com/in/..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">GitHub</label>
              <input
                type="url"
                {...register('personalInfo.github')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="https://github.com/..."
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Career Objective */}
      <Card>
        <CardHeader>
          <CardTitle>职业目标</CardTitle>
        </CardHeader>
        <CardContent>
          <textarea
            {...register('careerObjective')}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="简要描述您的职业目标和期望..."
          />
        </CardContent>
      </Card>

      {/* Skills */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>技能</CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                appendSkill({
                  name: '',
                  level: 'intermediate',
                  category: '',
                })
              }
            >
              + 添加技能
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {skillFields.length === 0 && (
            <p className="text-gray-500 text-center py-4">暂无技能，点击上方按钮添加</p>
          )}
          {skillFields.map((field, index) => (
            <div key={field.id} className="flex gap-4 items-start p-4 border rounded-md">
              <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                <input
                  type="text"
                  {...register(`skills.${index}.name`)}
                  placeholder="技能名称 *"
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <select
                  {...register(`skills.${index}.level`)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="beginner">初级</option>
                  <option value="intermediate">中级</option>
                  <option value="expert">精通</option>
                </select>
                <input
                  type="text"
                  {...register(`skills.${index}.category`)}
                  placeholder="分类（如：编程语言）"
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => removeSkill(index)}
                className="text-error-600"
              >
                删除
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Work Experience */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>工作经历</CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                appendWork({
                  id: `work-${Date.now()}`,
                  company: '',
                  position: '',
                  location: '',
                  startDate: '',
                  endDate: '',
                  isCurrent: false,
                  description: '',
                  achievements: [],
                  technologies: [],
                })
              }
            >
              + 添加工作经历
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {workFields.length === 0 && (
            <p className="text-gray-500 text-center py-4">
              暂无工作经历，点击上方按钮添加
            </p>
          )}
          {workFields.map((field, index) => (
            <div key={field.id} className="p-4 border rounded-md space-y-4">
              <div className="flex justify-between items-start">
                <h4 className="font-medium">工作经历 {index + 1}</h4>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeWork(index)}
                  className="text-error-600"
                >
                  删除
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  {...register(`workExperience.${index}.company`)}
                  placeholder="公司名称 *"
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <input
                  type="text"
                  {...register(`workExperience.${index}.position`)}
                  placeholder="职位 *"
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <input
                  type="text"
                  {...register(`workExperience.${index}.location`)}
                  placeholder="地点"
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <input
                  type="month"
                  {...register(`workExperience.${index}.startDate`)}
                  placeholder="开始日期 *"
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <input
                  type="month"
                  {...register(`workExperience.${index}.endDate`)}
                  placeholder="结束日期"
                  disabled={watch(`workExperience.${index}.isCurrent`)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100"
                />
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    {...register(`workExperience.${index}.isCurrent`)}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm">目前在职</span>
                </label>
              </div>

              <textarea
                {...register(`workExperience.${index}.description`)}
                rows={3}
                placeholder="工作描述"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Education */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>教育背景</CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                appendEdu({
                  id: `edu-${Date.now()}`,
                  institution: '',
                  degree: '',
                  major: '',
                  location: '',
                  startDate: '',
                  endDate: '',
                  achievements: [],
                })
              }
            >
              + 添加教育经历
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {eduFields.length === 0 && (
            <p className="text-gray-500 text-center py-4">
              暂无教育背景，点击上方按钮添加
            </p>
          )}
          {eduFields.map((field, index) => (
            <div key={field.id} className="p-4 border rounded-md space-y-4">
              <div className="flex justify-between items-start">
                <h4 className="font-medium">教育经历 {index + 1}</h4>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeEdu(index)}
                  className="text-error-600"
                >
                  删除
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  {...register(`education.${index}.institution`)}
                  placeholder="学校名称 *"
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <input
                  type="text"
                  {...register(`education.${index}.degree`)}
                  placeholder="学位 *"
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <input
                  type="text"
                  {...register(`education.${index}.major`)}
                  placeholder="专业 *"
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <input
                  type="text"
                  {...register(`education.${index}.location`)}
                  placeholder="地点"
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <input
                  type="month"
                  {...register(`education.${index}.startDate`)}
                  placeholder="开始日期 *"
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <input
                  type="month"
                  {...register(`education.${index}.endDate`)}
                  placeholder="结束日期"
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Error Message */}
      {error && (
        <div className="bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-4 sticky bottom-0 bg-white py-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          取消
        </Button>
        <Button type="submit" variant="primary" disabled={isSubmitting}>
          {isSubmitting ? '保存中...' : mode === 'create' ? '创建简历' : '保存修改'}
        </Button>
      </div>
    </form>
  )
}
