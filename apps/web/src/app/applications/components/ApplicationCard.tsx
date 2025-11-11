'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@careermatch/ui'
import Link from 'next/link'
import { Button } from '@careermatch/ui'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'

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
  draft: { label: '草稿', color: 'bg-gray-100 text-gray-800' },
  submitted: { label: '已提交', color: 'bg-blue-100 text-blue-800' },
  under_review: { label: '审核中', color: 'bg-yellow-100 text-yellow-800' },
  interview_scheduled: { label: '面试安排', color: 'bg-purple-100 text-purple-800' },
  offer_received: { label: '已录取', color: 'bg-green-100 text-green-800' },
  rejected: { label: '已拒绝', color: 'bg-red-100 text-red-800' },
  withdrawn: { label: '已撤回', color: 'bg-gray-100 text-gray-800' },
  accepted: { label: '已接受', color: 'bg-teal-100 text-teal-800' },
}

export function ApplicationCard({ application }: ApplicationCardProps) {
  const statusConfig = STATUS_CONFIG[application.status as keyof typeof STATUS_CONFIG] || {
    label: application.status,
    color: 'bg-gray-100 text-gray-800',
  }

  const job = application.jobs
  const resume = application.resumes

  // Get latest timeline event
  const latestEvent = application.timeline?.length
    ? application.timeline[application.timeline.length - 1]
    : null

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <CardTitle className="text-lg">
                {job?.title || '未知岗位'}
              </CardTitle>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig.color}`}
              >
                {statusConfig.label}
              </span>
            </div>
            <div className="text-sm text-gray-600">
              {job?.company || '未知公司'}
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
              <div className="text-gray-500">岗位类型</div>
              <div className="font-medium text-gray-900">
                {job?.job_type === 'full_time' && '全职'}
                {job?.job_type === 'part_time' && '兼职'}
                {job?.job_type === 'contract' && '合同'}
                {job?.job_type === 'internship' && '实习'}
                {!job?.job_type && '-'}
              </div>
            </div>
            <div>
              <div className="text-gray-500">薪资范围</div>
              <div className="font-medium text-gray-900">
                {job?.salary_min && job?.salary_max
                  ? `${job.salary_currency || 'NZD'} ${job.salary_min.toLocaleString()} - ${job.salary_max.toLocaleString()}`
                  : '-'}
              </div>
            </div>
          </div>

          {/* Resume Used */}
          <div className="text-sm">
            <div className="text-gray-500">使用简历</div>
            <div className="font-medium text-gray-900">
              {resume?.title || resume?.content?.personal_info?.full_name || '未知简历'}
            </div>
          </div>

          {/* Latest Event */}
          {latestEvent && (
            <div className="text-sm bg-gray-50 p-3 rounded-lg">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-medium text-gray-900">{latestEvent.description}</div>
                  <div className="text-gray-500 text-xs mt-1">
                    {formatDistanceToNow(new Date(latestEvent.date), {
                      addSuffix: true,
                      locale: zhCN,
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          {application.notes && (
            <div className="text-sm">
              <div className="text-gray-500">备注</div>
              <div className="text-gray-700 mt-1 line-clamp-2">{application.notes}</div>
            </div>
          )}

          {/* Timeline Count */}
          <div className="text-sm text-gray-500">
            {application.timeline?.length || 0} 个时间线事件
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Link href={`/applications/${application.id}`} className="flex-1">
              <Button variant="primary" className="w-full">
                查看详情
              </Button>
            </Link>
            <Link href={`/jobs/${job?.id}`} className="flex-1">
              <Button variant="outline" className="w-full">
                查看岗位
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
