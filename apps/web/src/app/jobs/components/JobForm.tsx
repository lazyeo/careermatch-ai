'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button, Card, CardContent, CardHeader, CardTitle } from '@careermatch/ui'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

// Zod schema for job validation
const jobSchema = z.object({
  title: z.string().min(1, '请输入岗位标题'),
  company: z.string().min(1, '请输入公司名称'),
  location: z.string().optional(),
  job_type: z.enum(['full-time', 'part-time', 'contract', 'internship', 'casual']).optional(),
  salary_min: z.number().min(0, '薪资不能为负数').optional().nullable(),
  salary_max: z.number().min(0, '薪资不能为负数').optional().nullable(),
  salary_currency: z.string().default('NZD'),
  description: z.string().optional(),
  requirements: z.string().optional(),
  benefits: z.string().optional(),
  source_url: z.string().url('请输入有效的URL').optional().or(z.literal('')),
  posted_date: z.string().optional(),
  deadline: z.string().optional(),
  status: z.enum(['saved', 'applied', 'interview', 'rejected', 'offer', 'withdrawn']).default('saved'),
})

type JobFormData = z.infer<typeof jobSchema>

interface JobFormProps {
  initialData?: {
    id?: string
    title: string
    company: string
    location?: string | null
    job_type?: string | null
    salary_min?: number | null
    salary_max?: number | null
    salary_currency?: string
    description?: string | null
    requirements?: string | null
    benefits?: string | null
    source_url?: string | null
    posted_date?: string | null
    deadline?: string | null
    status: string
  }
  mode: 'create' | 'edit'
}

export function JobForm({ initialData, mode }: JobFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<JobFormData>({
    resolver: zodResolver(jobSchema),
    defaultValues: initialData ? {
      title: initialData.title,
      company: initialData.company,
      location: initialData.location || '',
      job_type: (initialData.job_type as any) || undefined,
      salary_min: initialData.salary_min || undefined,
      salary_max: initialData.salary_max || undefined,
      salary_currency: initialData.salary_currency || 'NZD',
      description: initialData.description || '',
      requirements: initialData.requirements || '',
      benefits: initialData.benefits || '',
      source_url: initialData.source_url || '',
      posted_date: initialData.posted_date ? initialData.posted_date.split('T')[0] : '',
      deadline: initialData.deadline ? initialData.deadline.split('T')[0] : '',
      status: initialData.status as any,
    } : {
      salary_currency: 'NZD',
      status: 'saved',
    },
  })

  const onSubmit = async (data: JobFormData) => {
    setIsSubmitting(true)
    setError(null)

    try {
      const payload = {
        ...data,
        salary_min: data.salary_min || null,
        salary_max: data.salary_max || null,
        location: data.location || null,
        job_type: data.job_type || null,
        description: data.description || null,
        requirements: data.requirements || null,
        benefits: data.benefits || null,
        source_url: data.source_url || null,
        posted_date: data.posted_date || null,
        deadline: data.deadline || null,
      }

      if (mode === 'create') {
        const response = await fetch('/api/jobs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })

        if (!response.ok) {
          throw new Error('创建失败')
        }

        const job = await response.json()
        router.push('/jobs')
        router.refresh()
      } else {
        const response = await fetch(`/api/jobs/${initialData?.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })

        if (!response.ok) {
          throw new Error('更新失败')
        }

        router.push('/jobs')
        router.refresh()
      }
    } catch (err) {
      console.error('Error submitting job:', err)
      setError(err instanceof Error ? err.message : '操作失败，请重试')
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && (
        <div className="bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>基本信息</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              岗位标题 *
            </label>
            <input
              {...register('title')}
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="例如：Senior Full Stack Developer"
            />
            {errors.title && (
              <p className="text-error-600 text-sm mt-1">{errors.title.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              公司名称 *
            </label>
            <input
              {...register('company')}
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="例如：Xero"
            />
            {errors.company && (
              <p className="text-error-600 text-sm mt-1">{errors.company.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              工作地点
            </label>
            <input
              {...register('location')}
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="例如：Auckland, New Zealand"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                岗位类型
              </label>
              <select
                {...register('job_type')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">请选择</option>
                <option value="full-time">全职</option>
                <option value="part-time">兼职</option>
                <option value="contract">合同</option>
                <option value="internship">实习</option>
                <option value="casual">临时</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                状态
              </label>
              <select
                {...register('status')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="saved">已保存</option>
                <option value="applied">已申请</option>
                <option value="interview">面试中</option>
                <option value="rejected">已拒绝</option>
                <option value="offer">已录用</option>
                <option value="withdrawn">已撤回</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Salary Information */}
      <Card>
        <CardHeader>
          <CardTitle>薪资信息</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                最低薪资
              </label>
              <input
                {...register('salary_min', { valueAsNumber: true })}
                type="number"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="80000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                最高薪资
              </label>
              <input
                {...register('salary_max', { valueAsNumber: true })}
                type="number"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="120000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                货币
              </label>
              <select
                {...register('salary_currency')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="NZD">NZD</option>
                <option value="AUD">AUD</option>
                <option value="USD">USD</option>
                <option value="CNY">CNY</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Job Details */}
      <Card>
        <CardHeader>
          <CardTitle>岗位详情</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              岗位描述
            </label>
            <textarea
              {...register('description')}
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="输入岗位的主要职责和工作内容..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              岗位要求
            </label>
            <textarea
              {...register('requirements')}
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="输入技能要求、工作经验、教育背景等..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              福利待遇
            </label>
            <textarea
              {...register('benefits')}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="输入公司提供的福利待遇..."
            />
          </div>
        </CardContent>
      </Card>

      {/* Additional Information */}
      <Card>
        <CardHeader>
          <CardTitle>其他信息</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              来源链接
            </label>
            <input
              {...register('source_url')}
              type="url"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="https://www.seek.co.nz/job/..."
            />
            {errors.source_url && (
              <p className="text-error-600 text-sm mt-1">{errors.source_url.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                发布日期
              </label>
              <input
                {...register('posted_date')}
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                申请截止日期
              </label>
              <input
                {...register('deadline')}
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submit Buttons */}
      <div className="flex gap-4 justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          取消
        </Button>
        <Button
          type="submit"
          variant="primary"
          disabled={isSubmitting}
        >
          {isSubmitting ? '保存中...' : mode === 'create' ? '创建岗位' : '保存修改'}
        </Button>
      </div>
    </form>
  )
}
