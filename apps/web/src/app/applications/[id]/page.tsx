import { createClient, getCurrentUser } from '@/lib/supabase-server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { Button, Card, CardContent, CardHeader, CardTitle } from '@careermatch/ui'
import { Timeline } from '../components/Timeline'
import { StatusUpdater } from '../components/StatusUpdater'
import { DeleteApplicationButton } from '../components/DeleteApplicationButton'

interface PageProps {
  params: {
    id: string
  }
}

export default async function ApplicationDetailPage({ params }: PageProps) {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login?redirect=/applications')
  }

  const supabase = await createClient()

  // Fetch application with related data
  const { data: application, error } = await supabase
    .from('applications')
    .select(`
      *,
      jobs:job_id (
        id,
        title,
        company,
        location,
        status,
        job_type,
        salary_min,
        salary_max,
        currency,
        description,
        requirements,
        benefits,
        source_url,
        posted_date,
        deadline
      ),
      resumes:resume_id (
        id,
        title,
        full_name,
        email,
        phone
      )
    `)
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()

  if (error || !application) {
    notFound()
  }

  const job = application.jobs
  const resume = application.resumes

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

  const statusConfig = STATUS_CONFIG[application.status as keyof typeof STATUS_CONFIG] || {
    label: application.status,
    color: 'bg-gray-100 text-gray-800',
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900">
                  {job?.title || '申请详情'}
                </h1>
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusConfig.color}`}
                >
                  {statusConfig.label}
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                {job?.company || '未知公司'}
                {job?.location && ` · ${job.location}`}
              </p>
            </div>
            <div className="flex gap-2">
              <Link href={`/jobs/${job?.id}`}>
                <Button variant="outline">查看岗位</Button>
              </Link>
              <Link href="/applications">
                <Button variant="outline">返回列表</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status Management */}
            <Card>
              <CardHeader>
                <CardTitle>申请状态管理</CardTitle>
              </CardHeader>
              <CardContent>
                <StatusUpdater applicationId={application.id} currentStatus={application.status} />
              </CardContent>
            </Card>

            {/* Timeline */}
            <Card>
              <CardHeader>
                <CardTitle>申请时间线</CardTitle>
              </CardHeader>
              <CardContent>
                <Timeline events={application.timeline || []} />
              </CardContent>
            </Card>

            {/* Notes */}
            <Card>
              <CardHeader>
                <CardTitle>申请备注</CardTitle>
              </CardHeader>
              <CardContent>
                {application.notes ? (
                  <p className="text-gray-700 whitespace-pre-wrap">{application.notes}</p>
                ) : (
                  <p className="text-gray-500 italic">暂无备注</p>
                )}
              </CardContent>
            </Card>

            {/* Job Details */}
            {job && (
              <>
                {job.description && (
                  <Card>
                    <CardHeader>
                      <CardTitle>岗位描述</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700 whitespace-pre-wrap">{job.description}</p>
                    </CardContent>
                  </Card>
                )}

                {job.requirements && (
                  <Card>
                    <CardHeader>
                      <CardTitle>岗位要求</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700 whitespace-pre-wrap">{job.requirements}</p>
                    </CardContent>
                  </Card>
                )}

                {job.benefits && (
                  <Card>
                    <CardHeader>
                      <CardTitle>福利待遇</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700 whitespace-pre-wrap">{job.benefits}</p>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Application Info */}
            <Card>
              <CardHeader>
                <CardTitle>申请信息</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-sm text-gray-500">申请时间</div>
                  <div className="font-medium text-gray-900">
                    {new Date(application.created_at).toLocaleString('zh-CN')}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">最后更新</div>
                  <div className="font-medium text-gray-900">
                    {new Date(application.updated_at).toLocaleString('zh-CN')}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">时间线事件</div>
                  <div className="font-medium text-gray-900">
                    {application.timeline?.length || 0} 个事件
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Resume Info */}
            {resume && (
              <Card>
                <CardHeader>
                  <CardTitle>使用的简历</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <div className="font-medium text-gray-900">
                      {resume.title || resume.full_name}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">{resume.full_name}</div>
                  </div>
                  <div className="space-y-1 text-sm">
                    {resume.email && (
                      <div className="text-gray-600">
                        📧 {resume.email}
                      </div>
                    )}
                    {resume.phone && (
                      <div className="text-gray-600">
                        📱 {resume.phone}
                      </div>
                    )}
                  </div>
                  <Link href={`/resumes/${resume.id}`}>
                    <Button variant="outline" className="w-full mt-2">
                      查看简历
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}

            {/* Job Details Summary */}
            {job && (
              <Card>
                <CardHeader>
                  <CardTitle>岗位信息</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <div className="text-sm text-gray-500">岗位类型</div>
                    <div className="font-medium text-gray-900">
                      {job.job_type === 'full_time' && '全职'}
                      {job.job_type === 'part_time' && '兼职'}
                      {job.job_type === 'contract' && '合同'}
                      {job.job_type === 'internship' && '实习'}
                      {!job.job_type && '-'}
                    </div>
                  </div>
                  {(job.salary_min || job.salary_max) && (
                    <div>
                      <div className="text-sm text-gray-500">薪资范围</div>
                      <div className="font-medium text-gray-900">
                        {job.currency || 'NZD'} {job.salary_min?.toLocaleString()} -{' '}
                        {job.salary_max?.toLocaleString()}
                      </div>
                    </div>
                  )}
                  {job.posted_date && (
                    <div>
                      <div className="text-sm text-gray-500">发布日期</div>
                      <div className="font-medium text-gray-900">
                        {new Date(job.posted_date).toLocaleDateString('zh-CN')}
                      </div>
                    </div>
                  )}
                  {job.deadline && (
                    <div>
                      <div className="text-sm text-gray-500">申请截止</div>
                      <div className="font-medium text-gray-900">
                        {new Date(job.deadline).toLocaleDateString('zh-CN')}
                      </div>
                    </div>
                  )}
                  {job.source_url && (
                    <div>
                      <a
                        href={job.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
                      >
                        🔗 查看原始链接
                        <svg
                          className="w-3 h-3"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                          />
                        </svg>
                      </a>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle>操作</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link href={`/jobs/${job?.id}/analysis`} className="block">
                  <Button variant="outline" className="w-full">
                    查看AI分析
                  </Button>
                </Link>
                <DeleteApplicationButton applicationId={application.id} />
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
