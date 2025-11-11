import { createClient, getCurrentUser } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button, Card, CardContent, CardHeader, CardTitle } from '@careermatch/ui'
import { DeleteJobButton } from './components/DeleteJobButton'

export default async function JobsPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login?redirect=/jobs')
  }

  const supabase = await createClient()

  // Fetch user's jobs
  const { data: jobs, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })

  if (error) {
    console.error('Error fetching jobs:', error)
  }

  const jobCount = jobs?.length || 0
  const savedCount = jobs?.filter(j => j.status === 'saved').length || 0
  const appliedCount = jobs?.filter(j => j.status === 'applied').length || 0
  const interviewCount = jobs?.filter(j => j.status === 'interview').length || 0

  // Helper function to display job type
  const getJobTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'full-time': '全职',
      'part-time': '兼职',
      'contract': '合同',
      'internship': '实习',
      'casual': '临时',
    }
    return labels[type] || type
  }

  // Helper function to display status
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

  // Helper function for status badge color
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">岗位管理</h1>
              <p className="text-sm text-gray-600 mt-1">
                保存和追踪您感兴趣的岗位
              </p>
            </div>
            <Link href="/dashboard">
              <Button variant="outline">返回仪表盘</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary-600">{jobCount}</div>
                <div className="text-sm text-gray-600 mt-1">岗位总数</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-neutral-600">{savedCount}</div>
                <div className="text-sm text-gray-600 mt-1">已保存</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-accent-600">{appliedCount}</div>
                <div className="text-sm text-gray-600 mt-1">已申请</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-warning-600">{interviewCount}</div>
                <div className="text-sm text-gray-600 mt-1">面试中</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Bar */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-gray-900">我的岗位</h2>
          <Link href="/jobs/new">
            <Button variant="primary">
              + 添加岗位
            </Button>
          </Link>
        </div>

        {/* Job List */}
        {jobCount === 0 ? (
          <Card>
            <CardContent className="py-16">
              <div className="text-center">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">暂无岗位</h3>
                <p className="mt-1 text-sm text-gray-500">
                  添加您感兴趣的岗位，开始智能匹配分析
                </p>
                <div className="mt-6">
                  <Link href="/jobs/new">
                    <Button variant="primary">
                      + 添加岗位
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {jobs?.map((job) => (
              <Card key={job.id} className="relative hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <CardTitle className="text-lg flex-1 pr-2">
                      {job.title}
                    </CardTitle>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(job.status)}`}>
                      {getStatusLabel(job.status)}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 font-medium">{job.company}</div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    {job.location && (
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>{job.location}</span>
                      </div>
                    )}

                    {job.job_type && (
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <span>{getJobTypeLabel(job.job_type)}</span>
                      </div>
                    )}

                    {(job.salary_min || job.salary_max) && (
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>
                          {job.salary_currency} {job.salary_min?.toLocaleString()}
                          {job.salary_max ? ` - ${job.salary_max.toLocaleString()}` : '+'}
                        </span>
                      </div>
                    )}

                    <div className="text-xs text-gray-500 pt-2">
                      更新于 {new Date(job.updated_at).toLocaleDateString('zh-CN')}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Link href={`/jobs/${job.id}`} className="flex-1">
                      <Button variant="outline" className="w-full" size="sm">
                        查看
                      </Button>
                    </Link>
                    <Link href={`/jobs/${job.id}/edit`} className="flex-1">
                      <Button variant="primary" className="w-full" size="sm">
                        编辑
                      </Button>
                    </Link>
                    <DeleteJobButton jobId={job.id} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
