'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button, Card, CardContent, CardHeader, CardTitle, Field, fieldControlClasses } from '@careermatch/ui'
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
        <div className="rounded-md border border-clay-soft bg-clay-soft px-4 py-3 text-sm text-clay">
          {error}
        </div>
      )}

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>{formT('basicInfo')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field label={formT('jobTitleRequired')} error={errors.title?.message}>
            <input
              {...register('title')}
              type="text"
              className={fieldControlClasses}
              placeholder={formT('jobTitlePlaceholder')}
            />
          </Field>

          <Field label={formT('companyRequired')} error={errors.company?.message}>
            <input
              {...register('company')}
              type="text"
              className={fieldControlClasses}
              placeholder={formT('companyPlaceholder')}
            />
          </Field>

          <Field label={t('location')}>
            <input
              {...register('location')}
              type="text"
              className={fieldControlClasses}
              placeholder={formT('locationPlaceholder')}
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label={t('jobType')}>
              <select
                {...register('job_type')}
                className={fieldControlClasses}
              >
                <option value="">{formT('selectPlaceholder')}</option>
                <option value="full-time">{t('fullTime')}</option>
                <option value="part-time">{t('partTime')}</option>
                <option value="contract">{t('contract')}</option>
                <option value="internship">{t('internship')}</option>
                <option value="casual">{t('casual')}</option>
              </select>
            </Field>

            <Field label={t('status')}>
              <select
                {...register('status')}
                className={fieldControlClasses}
              >
                <option value="saved">{t('statusLabels.saved')}</option>
                <option value="applied">{t('statusLabels.applied')}</option>
                <option value="interview">{t('statusLabels.interview')}</option>
                <option value="rejected">{t('statusLabels.rejected')}</option>
                <option value="offer">{t('statusLabels.offer')}</option>
                <option value="withdrawn">{t('statusLabels.withdrawn')}</option>
              </select>
            </Field>
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
            <Field label={formT('minSalary')}>
              <input
                {...register('salary_min', { valueAsNumber: true })}
                type="number"
                className={fieldControlClasses}
                placeholder="80000"
              />
            </Field>

            <Field label={formT('maxSalary')}>
              <input
                {...register('salary_max', { valueAsNumber: true })}
                type="number"
                className={fieldControlClasses}
                placeholder="120000"
              />
            </Field>

            <Field label={formT('currency')}>
              <select
                {...register('salary_currency')}
                className={fieldControlClasses}
              >
                <option value="NZD">NZD</option>
                <option value="AUD">AUD</option>
                <option value="USD">USD</option>
                <option value="CNY">CNY</option>
              </select>
            </Field>
          </div>
        </CardContent>
      </Card>

      {/* Job Details */}
      <Card>
        <CardHeader>
          <CardTitle>{formT('jobDetails')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field label={t('description')}>
            <textarea
              {...register('description')}
              rows={6}
              className={`${fieldControlClasses} h-auto py-2`}
              placeholder={formT('descriptionPlaceholder')}
            />
          </Field>

          <Field label={t('requirements')}>
            <textarea
              {...register('requirements')}
              rows={6}
              className={`${fieldControlClasses} h-auto py-2`}
              placeholder={formT('requirementsPlaceholder')}
            />
          </Field>

          <Field label={t('benefits')}>
            <textarea
              {...register('benefits')}
              rows={4}
              className={`${fieldControlClasses} h-auto py-2`}
              placeholder={formT('benefitsPlaceholder')}
            />
          </Field>
        </CardContent>
      </Card>

      {/* Additional Information */}
      <Card>
        <CardHeader>
          <CardTitle>{formT('otherInfo')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field label={formT('sourceUrl')} error={errors.source_url?.message}>
            <input
              {...register('source_url')}
              type="url"
              className={fieldControlClasses}
              placeholder="https://www.seek.co.nz/job/..."
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label={formT('postedDate')}>
              <input
                {...register('posted_date')}
                type="date"
                className={fieldControlClasses}
              />
            </Field>

            <Field label={formT('deadline')}>
              <input
                {...register('deadline')}
                type="date"
                className={fieldControlClasses}
              />
            </Field>
          </div>
        </CardContent>
      </Card>

      {/* Submit Buttons */}
      <div className="flex gap-4 justify-end">
        <Button
          type="button"
          variant="secondary"
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
