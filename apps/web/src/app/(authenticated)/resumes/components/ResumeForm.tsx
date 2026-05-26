'use client'

import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button, Card, CardContent, CardHeader, CardTitle } from '@careermatch/ui'
import type { ResumeContent } from '@careermatch/shared'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'

// Zod schema for resume validation
const resumeSchema = z.object({
  title: z.string().min(1, 'Please enter a resume title'),
  personalInfo: z.object({
    fullName: z.string().min(1, 'Please enter your name'),
    email: z.string().email('Please enter a valid email'),
    phone: z.string().optional(),
    location: z.string().optional(),
    linkedIn: z.string().optional(),
    github: z.string().optional(),
    website: z.string().optional(),
  }),
  careerObjective: z.string().optional(),
  skills: z.array(z.object({
    name: z.string().min(1, 'Please enter a skill name'),
    level: z.enum(['beginner', 'intermediate', 'expert']).optional(),
    years: z.number().optional(),
    category: z.string().optional(),
  })).default([]),
  workExperience: z.array(z.object({
    id: z.string(),
    company: z.string().min(1, 'Please enter a company name'),
    position: z.string().min(1, 'Please enter a position'),
    location: z.string().optional(),
    startDate: z.string().min(1, 'Please enter a start date'),
    endDate: z.string().optional(),
    isCurrent: z.boolean(),
    description: z.string(),
    achievements: z.array(z.string()).default([]),
    technologies: z.array(z.string()).default([]),
  })).default([]),
  projects: z.array(z.object({
    id: z.string(),
    name: z.string().min(1, 'Please enter a project name'),
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
    institution: z.string().min(1, 'Please enter an institution'),
    degree: z.string().min(1, 'Please enter a degree'),
    major: z.string().min(1, 'Please enter a major'),
    location: z.string().optional(),
    startDate: z.string().min(1, 'Please enter a start date'),
    endDate: z.string().optional(),
    gpa: z.number().optional(),
    achievements: z.array(z.string()).default([]),
  })).default([]),
  certifications: z.array(z.object({
    id: z.string(),
    name: z.string().min(1, 'Please enter a certification name'),
    issuer: z.string().min(1, 'Please enter an issuer'),
    issueDate: z.string().min(1, 'Please enter an issue date'),
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
  const t = useTranslations('resumes')
  const formT = useTranslations('resumes.form')
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
        title: formT('defaultTitle'),
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
      toast.success(mode === 'create' ? formT('created') : formT('saved'))
      router.push(`/resumes`)
      router.refresh()
    } catch (err) {
      console.error('Error saving resume:', err)
      const errorMessage = formT('saveFailed')
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
          <CardTitle>{t('resumeTitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          <input
            type="text"
            {...register('title')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder={formT('titlePlaceholder')}
          />
          {errors.title && (
            <p className="text-error-600 text-sm mt-1">{errors.title.message}</p>
          )}
        </CardContent>
      </Card>

      {/* Personal Info */}
      <Card>
        <CardHeader>
          <CardTitle>{t('personalInfo')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('fullName')} <span className="text-error-600">*</span>
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
                {t('email')} <span className="text-error-600">*</span>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('phone')}</label>
              <input
                type="tel"
                {...register('personalInfo.phone')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('location')}</label>
              <input
                type="text"
                {...register('personalInfo.location')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder={formT('locationPlaceholder')}
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
          <CardTitle>{t('careerObjective')}</CardTitle>
        </CardHeader>
        <CardContent>
          <textarea
            {...register('careerObjective')}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder={formT('objectivePlaceholder')}
          />
        </CardContent>
      </Card>

      {/* Skills */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>{t('skills')}</CardTitle>
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
              + {t('addSkill')}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {skillFields.length === 0 && (
            <p className="text-gray-500 text-center py-4">{formT('emptySkills')}</p>
          )}
          {skillFields.map((field, index) => (
            <div key={field.id} className="flex gap-4 items-start p-4 border rounded-md">
              <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                <input
                  type="text"
                  {...register(`skills.${index}.name`)}
                  placeholder={formT('skillNamePlaceholder')}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <select
                  {...register(`skills.${index}.level`)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="beginner">{t('skillLevels.beginner')}</option>
                  <option value="intermediate">{t('skillLevels.intermediate')}</option>
                  <option value="expert">{t('skillLevels.expert')}</option>
                </select>
                <input
                  type="text"
                  {...register(`skills.${index}.category`)}
                  placeholder={formT('skillCategoryPlaceholder')}
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
                {formT('delete')}
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Work Experience */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>{t('workExperience')}</CardTitle>
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
              + {t('addExperience')}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {workFields.length === 0 && (
            <p className="text-gray-500 text-center py-4">
              {formT('emptyWork')}
            </p>
          )}
          {workFields.map((field, index) => (
            <div key={field.id} className="p-4 border rounded-md space-y-4">
              <div className="flex justify-between items-start">
                <h4 className="font-medium">{formT('workItem', { index: index + 1 })}</h4>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeWork(index)}
                  className="text-error-600"
                >
                  {formT('delete')}
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  {...register(`workExperience.${index}.company`)}
                  placeholder={formT('companyPlaceholder')}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <input
                  type="text"
                  {...register(`workExperience.${index}.position`)}
                  placeholder={formT('positionPlaceholder')}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <input
                  type="text"
                  {...register(`workExperience.${index}.location`)}
                  placeholder={formT('locationPlaceholder')}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <input
                  type="month"
                  {...register(`workExperience.${index}.startDate`)}
                  placeholder={formT('startDatePlaceholder')}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <input
                  type="month"
                  {...register(`workExperience.${index}.endDate`)}
                  placeholder={formT('endDatePlaceholder')}
                  disabled={watch(`workExperience.${index}.isCurrent`)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100"
                />
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    {...register(`workExperience.${index}.isCurrent`)}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm">{formT('currentRole')}</span>
                </label>
              </div>

              <textarea
                {...register(`workExperience.${index}.description`)}
                rows={3}
                placeholder={formT('workDescriptionPlaceholder')}
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
            <CardTitle>{t('education')}</CardTitle>
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
              + {t('addEducation')}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {eduFields.length === 0 && (
            <p className="text-gray-500 text-center py-4">
              {formT('emptyEducation')}
            </p>
          )}
          {eduFields.map((field, index) => (
            <div key={field.id} className="p-4 border rounded-md space-y-4">
              <div className="flex justify-between items-start">
                <h4 className="font-medium">{formT('educationItem', { index: index + 1 })}</h4>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeEdu(index)}
                  className="text-error-600"
                >
                  {formT('delete')}
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  {...register(`education.${index}.institution`)}
                  placeholder={formT('institutionPlaceholder')}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <input
                  type="text"
                  {...register(`education.${index}.degree`)}
                  placeholder={formT('degreePlaceholder')}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <input
                  type="text"
                  {...register(`education.${index}.major`)}
                  placeholder={formT('majorPlaceholder')}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <input
                  type="text"
                  {...register(`education.${index}.location`)}
                  placeholder={formT('locationPlaceholder')}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <input
                  type="month"
                  {...register(`education.${index}.startDate`)}
                  placeholder={formT('startDatePlaceholder')}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <input
                  type="month"
                  {...register(`education.${index}.endDate`)}
                  placeholder={formT('endDatePlaceholder')}
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
          {formT('cancel')}
        </Button>
        <Button type="submit" variant="primary" disabled={isSubmitting}>
          {isSubmitting ? formT('saving') : mode === 'create' ? formT('create') : formT('save')}
        </Button>
      </div>
    </form>
  )
}
