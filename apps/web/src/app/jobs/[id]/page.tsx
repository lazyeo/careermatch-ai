import { redirect, notFound } from 'next/navigation'
import { getCurrentUser, createClient } from '@/lib/supabase-server'
import Link from 'next/link'
import { Button, Card, CardContent, CardHeader, CardTitle } from '@careermatch/ui'
import { ApplyJobButton } from './components/ApplyJobButton'

// Job detail page component
export default async function JobDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login?redirect=/jobs/' + params.id)
  }

  const supabase = await createClient()

  // Fetch the job
  const { data: job, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()

  if (error || !job) {
    notFound()
  }

  // Helper functions
  const getJobTypeLabel = (type: string | null) => {
    if (!type) return '未指定'
    const labels: Record<string, string> = {
      'full-time': '全职',
      'part-time': '兼职',
      'contract': '合同',
      'internship': '实习',
      'casual': '临时',
    }
    return labels[type] || type
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'saved': '已保存',
      'applied': '已申请',
      'interview': '面试中',
      'rejected': '已拒绝',
      'offer': '已录用',
      'withdrawn': '已撤回',
    }
    return labels[status] || status
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'saved': 'bg-neutral-100 text-neutral-800',
      'applied': 'bg-primary-100 text-primary-800',
      'interview': 'bg-warning-100 text-warning-800',
      'rejected': 'bg-error-100 text-error-800',
      'offer': 'bg-success-100 text-success-800',
      'withdrawn': 'bg-neutral-200 text-neutral-600',
    }
    return colors[status] || 'bg-neutral-100 text-neutral-800'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900">{job.title}</h1>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(job.status)}`}>
                  {getStatusLabel(job.status)}
                </span>
              </div>
              <p className="text-lg text-gray-600 mt-1">{job.company}</p>
              <p className="text-sm text-gray-500 mt-1">
                更新于 {new Date(job.updated_at).toLocaleDateString('zh-CN')}
              </p>
            </div>
            <div className="flex gap-2">
              <Link href={`/jobs/${params.id}/edit`}>
                <Button variant="primary">编辑</Button>
              </Link>
              <Link href="/jobs">
                <Button variant="outline">返回列表</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>基本信息</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm font-medium text-gray-500">岗位标题</span>
                <p className="mt-1 text-gray-900">{job.title}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">公司名称</span>
                <p className="mt-1 text-gray-900">{job.company}</p>
              </div>
              {job.location && (
                <div>
                  <span className="text-sm font-medium text-gray-500">工作地点</span>
                  <p className="mt-1 text-gray-900">{job.location}</p>
                </div>
              )}
              {job.job_type && (
                <div>
                  <span className="text-sm font-medium text-gray-500">岗位类型</span>
                  <p className="mt-1 text-gray-900">{getJobTypeLabel(job.job_type)}</p>
                </div>
              )}
              {(job.salary_min || job.salary_max) && (
                <div>
                  <span className="text-sm font-medium text-gray-500">薪资范围</span>
                  <p className="mt-1 text-gray-900">
                    {job.salary_currency} {job.salary_min?.toLocaleString() || '0'}
                    {job.salary_max ? ` - ${job.salary_max.toLocaleString()}` : '+'}
                  </p>
                </div>
              )}
              {job.source_url && (
                <div className="col-span-2">
                  <span className="text-sm font-medium text-gray-500">来源链接</span>
                  <p className="mt-1">
                    <a
                      href={job.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:underline break-all"
                    >
                      {job.source_url}
                    </a>
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Job Description */}
        {job.description && (
          <Card>
            <CardHeader>
              <CardTitle>岗位描述</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
                {job.description}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Requirements */}
        {job.requirements && (
          <Card>
            <CardHeader>
              <CardTitle>岗位要求</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
                {job.requirements}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Benefits */}
        {job.benefits && (
          <Card>
            <CardHeader>
              <CardTitle>福利待遇</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
                {job.benefits}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Timeline */}
        {(job.posted_date || job.deadline) && (
          <Card>
            <CardHeader>
              <CardTitle>时间信息</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {job.posted_date && (
                  <div>
                    <span className="text-sm font-medium text-gray-500">发布日期</span>
                    <p className="mt-1 text-gray-900">
                      {new Date(job.posted_date).toLocaleDateString('zh-CN')}
                    </p>
                  </div>
                )}
                {job.deadline && (
                  <div>
                    <span className="text-sm font-medium text-gray-500">截止日期</span>
                    <p className="mt-1 text-gray-900">
                      {new Date(job.deadline).toLocaleDateString('zh-CN')}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Apply for Job */}
          <ApplyJobButton jobId={params.id} />

          {/* AI Match Analysis */}
          <Card className="bg-gradient-to-br from-primary-50 to-accent-50 border-primary-200">
            <CardContent className="py-12">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary-100 mb-4">
                  <svg className="w-6 h-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  AI智能匹配分析
                </h3>
                <p className="text-sm text-gray-600 max-w-md mx-auto mb-6">
                  分析简历与岗位匹配度，获得优化建议
                </p>
                <Link href={`/jobs/${params.id}/analysis`}>
                  <Button variant="primary" className="gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    开始分析
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* AI Cover Letter */}
          <Card className="bg-gradient-to-br from-accent-50 to-success-50 border-accent-200">
            <CardContent className="py-12">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-accent-100 mb-4">
                  <svg className="w-6 h-6 text-accent-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  AI求职信生成
                </h3>
                <p className="text-sm text-gray-600 max-w-md mx-auto mb-6">
                  根据岗位要求生成个性化求职信
                </p>
                <Link href={`/jobs/${params.id}/cover-letter`}>
                  <Button variant="primary" className="gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    生成求职信
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
