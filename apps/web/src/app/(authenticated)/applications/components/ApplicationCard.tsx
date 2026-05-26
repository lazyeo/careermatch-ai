'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@careermatch/ui'
import Link from 'next/link'
import { Button } from '@careermatch/ui'
import { formatDistanceToNow } from 'date-fns'
import { enUS, zhCN } from 'date-fns/locale'
import { useLocale, useTranslations } from 'next-intl'

interface Application {
  id: string
  status: string
  notes?: string
  created_at: string
  updated_at: string
  timeline: Array<{
    type: string
    date: string
    description: string
    oldStatus?: string
    newStatus?: string
  }>
  jobs: {
    id: string
    title: string
    company: string
    location?: string
    status: string
    job_type?: string
    salary_min?: number
    salary_max?: number
    salary_currency?: string
  } | null
  resumes: {
    id: string
    title?: string
    content: {
      personal_info?: {
        full_name?: string
      }
    }
  } | null
}

interface ApplicationCardProps {
  application: Application
}

const STATUS_CONFIG = {
  draft: { labelKey: 'draft', color: 'bg-gray-100 text-gray-800' },
  submitted: { labelKey: 'submitted', color: 'bg-blue-100 text-blue-800' },
  under_review: { labelKey: 'underReview', color: 'bg-yellow-100 text-yellow-800' },
  interview_scheduled: { labelKey: 'interviewScheduled', color: 'bg-purple-100 text-purple-800' },
  offer_received: { labelKey: 'offerReceived', color: 'bg-green-100 text-green-800' },
  rejected: { labelKey: 'rejected', color: 'bg-red-100 text-red-800' },
  withdrawn: { labelKey: 'withdrawn', color: 'bg-gray-100 text-gray-800' },
  accepted: { labelKey: 'accepted', color: 'bg-teal-100 text-teal-800' },
}

export function ApplicationCard({ application }: ApplicationCardProps) {
  const t = useTranslations('applications')
  const tJobs = useTranslations('jobs')
  const locale = useLocale()
  const dateLocale = locale === 'zh-CN' ? zhCN : enUS
  const statusConfig = STATUS_CONFIG[application.status as keyof typeof STATUS_CONFIG] || {
    labelKey: null,
    color: 'bg-gray-100 text-gray-800',
  }

  const job = application.jobs
  const resume = application.resumes

  const latestEvent = application.timeline?.length
    ? application.timeline[application.timeline.length - 1]
    : null
  const latestEventStatus = latestEvent?.newStatus
    ? getApplicationStatusLabel(latestEvent.newStatus, t)
    : statusConfig.labelKey
      ? t(statusConfig.labelKey)
      : application.status
  const latestEventDescription = latestEvent
    ? getTimelineDescription(latestEvent, latestEventStatus, t)
    : null

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <CardTitle className="text-lg">
                {job?.title || t('unknownJob')}
              </CardTitle>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig.color}`}
              >
                {statusConfig.labelKey ? t(statusConfig.labelKey) : application.status}
              </span>
            </div>
            <div className="text-sm text-gray-600">
              {job?.company || t('unknownCompany')}
              {job?.location && ` · ${job.location}`}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Job Details */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-gray-500">{t('jobType')}</div>
              <div className="font-medium text-gray-900">
                {job?.job_type === 'full_time' && tJobs('fullTime')}
                {job?.job_type === 'part_time' && tJobs('partTime')}
                {job?.job_type === 'contract' && tJobs('contract')}
                {job?.job_type === 'internship' && tJobs('internship')}
                {!job?.job_type && '-'}
              </div>
            </div>
            <div>
              <div className="text-gray-500">{t('salaryRange')}</div>
              <div className="font-medium text-gray-900">
                {job?.salary_min && job?.salary_max
                  ? `${job.salary_currency || 'NZD'} ${job.salary_min.toLocaleString()} - ${job.salary_max.toLocaleString()}`
                  : '-'}
              </div>
            </div>
          </div>

          {/* Resume Used */}
          <div className="text-sm">
            <div className="text-gray-500">{t('resumeUsed')}</div>
            <div className="font-medium text-gray-900">
              {resume?.title || resume?.content?.personal_info?.full_name || t('unnamedResume')}
            </div>
          </div>

          {/* Latest Event */}
          {latestEvent && (
            <div className="text-sm bg-gray-50 p-3 rounded-lg">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-medium text-gray-900">{latestEventDescription}</div>
                  <div className="text-gray-500 text-xs mt-1">
                    {formatDistanceToNow(new Date(latestEvent.date), {
                      addSuffix: true,
                      locale: dateLocale,
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          {application.notes && (
            <div className="text-sm">
              <div className="text-gray-500">{t('notes')}</div>
              <div className="text-gray-700 mt-1 line-clamp-2">{application.notes}</div>
            </div>
          )}

          {/* Timeline Count */}
          <div className="text-sm text-gray-500">
            {t('timelineEventsCount', { count: application.timeline?.length || 0 })}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Link href={`/applications/${application.id}`} className="flex-1">
              <Button variant="primary" className="w-full">
                {t('viewDetails')}
              </Button>
            </Link>
            <Link href={`/jobs/${job?.id}`} className="flex-1">
              <Button variant="outline" className="w-full">
                {t('viewJob')}
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function getApplicationStatusLabel(
  status: string,
  t: ReturnType<typeof useTranslations<'applications'>>
) {
  const statusKeyMap: Record<string, string> = {
    draft: 'draft',
    submitted: 'submitted',
    under_review: 'underReview',
    interview_scheduled: 'interviewScheduled',
    offer_received: 'offerReceived',
    rejected: 'rejected',
    withdrawn: 'withdrawn',
    accepted: 'accepted',
  }

  const key = statusKeyMap[status]
  return key ? t(key) : status
}

function getTimelineDescription(
  event: Application['timeline'][number],
  status: string,
  t: ReturnType<typeof useTranslations<'applications'>>
) {
  const eventTypeMap: Record<string, string> = {
    created: 'timelineDescriptions.created',
    submitted: 'timelineDescriptions.submitted',
    status_change: 'timelineDescriptions.status_change',
    status_changed: 'timelineDescriptions.status_changed',
    interview: 'timelineDescriptions.interview',
    offer: 'timelineDescriptions.offer',
    rejected: 'timelineDescriptions.rejected',
    withdrawn: 'timelineDescriptions.withdrawn',
    note_added: 'timelineDescriptions.note_added',
  }

  const key = eventTypeMap[event.type]
  return key ? t(key, { status }) : event.description
}
