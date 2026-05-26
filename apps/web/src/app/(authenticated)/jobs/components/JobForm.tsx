'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button, Card, CardContent, CardHeader, CardTitle } from '@careermatch/ui'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useTranslations } from 'next-intl'

// Zod schema for job validation
const jobSchema = z.object({
  title: z.string().min(1, 'Please enter a job title'),
  company: z.string().min(1, 'Please enter a company name'),
  location: z.string().optional(),
  job_type: z.enum(['full-time', 'part-time', 'contract', 'internship', 'casual']).optional(),
  salary_min: z.number().min(0, 'Salary cannot be negative').optional().nullable(),
  salary_max: z.number().min(0, 'Salary cannot be negative').optional().nullable(),
  salary_currency: z.string().default('NZD'),
  description: z.string().optional(),
  requirements: z.string().optional(),
  benefits: z.string().optional(),
  source_url: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
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
  const t = useTranslations('jobs')
  const formT = useTranslations('jobs.form')
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
      job_type: (initialData.job_type as "full-time" | "part-time" | "contract" | "internship" | "casual" | undefined) || undefined,
      salary_min: initialData.salary_min || undefined,
      salary_max: initialData.salary_max || undefined,
      salary_currency: initialData.salary_currency || 'NZD',
      description: initialData.description || '',
      requirements: initialData.requirements || '',
      benefits: initialData.benefits || '',
      source_url: initialData.source_url || '',
      posted_date: initialData.posted_date ? initialData.posted_date.split('T')[0] : '',
      deadline: initialData.deadline ? initialData.deadline.split('T')[0] : '',
      status: initialData.status as "saved" | "applied" | "interview" | "rejected" | "offer" | "withdrawn",
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
          throw new Error(formT('createFailed'))
        }

        await response.json()
        router.push('/jobs')
        router.refresh()
      } else {
        const response = await fetch(`/api/jobs/${initialData?.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })

        if (!response.ok) {
          throw new Error(formT('updateFailed'))
        }

        router.push('/jobs')
        router.refresh()
      }
    } catch (err) {
      console.error('Error submitting job:', err)
      setError(err instanceof Error ? err.message : formT('submitFailed'))
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
          <CardTitle>{formT('basicInfo')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {formT('jobTitleRequired')}
            </label>
            <input
              {...register('title')}
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder={formT('jobTitlePlaceholder')}
            />
            {errors.title && (
              <p className="text-error-600 text-sm mt-1">{errors.title.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {formT('companyRequired')}
            </label>
            <input
              {...register('company')}
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder={formT('companyPlaceholder')}
            />
            {errors.company && (
              <p className="text-error-600 text-sm mt-1">{errors.company.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('location')}
            </label>
            <input
              {...register('location')}
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder={formT('locationPlaceholder')}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('jobType')}
              </label>
              <select
                {...register('job_type')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">{formT('selectPlaceholder')}</option>
                <option value="full-time">{t('fullTime')}</option>
                <option value="part-time">{t('partTime')}</option>
                <option value="contract">{t('contract')}</option>
                <option value="internship">{t('internship')}</option>
                <option value="casual">{t('casual')}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('status')}
              </label>
              <select
                {...register('status')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="saved">{t('statusLabels.saved')}</option>
                <option value="applied">{t('statusLabels.applied')}</option>
                <option value="interview">{t('statusLabels.interview')}</option>
                <option value="rejected">{t('statusLabels.rejected')}</option>
                <option value="offer">{t('statusLabels.offer')}</option>
                <option value="withdrawn">{t('statusLabels.withdrawn')}</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Salary Information */}
      <Card>
        <CardHeader>
          <CardTitle>{formT('salaryInfo')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {formT('minSalary')}
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
                {formT('maxSalary')}
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
                {formT('currency')}
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
          <CardTitle>{formT('jobDetails')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('description')}
            </label>
            <textarea
              {...register('description')}
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder={formT('descriptionPlaceholder')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('requirements')}
            </label>
            <textarea
              {...register('requirements')}
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder={formT('requirementsPlaceholder')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('benefits')}
            </label>
            <textarea
              {...register('benefits')}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder={formT('benefitsPlaceholder')}
            />
          </div>
        </CardContent>
      </Card>

      {/* Additional Information */}
      <Card>
        <CardHeader>
          <CardTitle>{formT('otherInfo')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {formT('sourceUrl')}
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
                {formT('postedDate')}
              </label>
              <input
                {...register('posted_date')}
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {formT('deadline')}
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
          {formT('cancel')}
        </Button>
        <Button
          type="submit"
          variant="primary"
          disabled={isSubmitting}
        >
          {isSubmitting ? formT('saving') : mode === 'create' ? formT('createJob') : formT('saveChanges')}
        </Button>
      </div>
    </form>
  )
}
