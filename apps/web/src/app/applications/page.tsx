import { createClient, getCurrentUser } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button, Card, CardContent, CardHeader, CardTitle } from '@careermatch/ui'
import { ApplicationCard } from './components/ApplicationCard'

export default async function ApplicationsPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login?redirect=/applications')
  }

  const supabase = await createClient()

  // Fetch user's applications with related job and resume data
  const { data: applications, error } = await supabase
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
        currency
      ),
      resumes:resume_id (
        id,
        title,
        full_name
      )
    `)
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })

  if (error) {
    console.error('Error fetching applications:', error)
  }

  const applicationCount = applications?.length || 0

  // Calculate statistics
  const stats = {
    total: applicationCount,
    draft: applications?.filter(a => a.status === 'draft').length || 0,
    submitted: applications?.filter(a => a.status === 'submitted').length || 0,
    under_review: applications?.filter(a => a.status === 'under_review').length || 0,
    interview_scheduled: applications?.filter(a => a.status === 'interview_scheduled').length || 0,
    offer_received: applications?.filter(a => a.status === 'offer_received').length || 0,
    rejected: applications?.filter(a => a.status === 'rejected').length || 0,
    withdrawn: applications?.filter(a => a.status === 'withdrawn').length || 0,
    accepted: applications?.filter(a => a.status === 'accepted').length || 0,
  }

  const activeApplications = stats.submitted + stats.under_review + stats.interview_scheduled

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">申请追踪</h1>
              <p className="text-sm text-gray-600 mt-1">
                管理您的所有求职申请，追踪申请进度和状态
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
                <div className="text-3xl font-bold text-primary-600">{stats.total}</div>
                <div className="text-sm text-gray-600 mt-1">总申请数</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{activeApplications}</div>
                <div className="text-sm text-gray-600 mt-1">进行中</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">{stats.interview_scheduled}</div>
                <div className="text-sm text-gray-600 mt-1">面试安排</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-success-600">{stats.offer_received}</div>
                <div className="text-sm text-gray-600 mt-1">已获录取</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Status Breakdown */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>申请状态分布</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">草稿</span>
                <span className="text-lg font-semibold text-gray-900">{stats.draft}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <span className="text-sm text-blue-700">已提交</span>
                <span className="text-lg font-semibold text-blue-900">{stats.submitted}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <span className="text-sm text-yellow-700">审核中</span>
                <span className="text-lg font-semibold text-yellow-900">{stats.under_review}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                <span className="text-sm text-purple-700">面试安排</span>
                <span className="text-lg font-semibold text-purple-900">{stats.interview_scheduled}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <span className="text-sm text-green-700">已录取</span>
                <span className="text-lg font-semibold text-green-900">{stats.offer_received}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <span className="text-sm text-red-700">已拒绝</span>
                <span className="text-lg font-semibold text-red-900">{stats.rejected}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">已撤回</span>
                <span className="text-lg font-semibold text-gray-900">{stats.withdrawn}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-teal-50 rounded-lg">
                <span className="text-sm text-teal-700">已接受</span>
                <span className="text-lg font-semibold text-teal-900">{stats.accepted}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Bar */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-gray-900">我的申请</h2>
          <Link href="/jobs">
            <Button variant="primary">
              + 浏览岗位并申请
            </Button>
          </Link>
        </div>

        {/* Application List */}
        {applicationCount === 0 ? (
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
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">暂无申请记录</h3>
                <p className="mt-1 text-sm text-gray-500">
                  浏览岗位并创建您的第一个申请
                </p>
                <div className="mt-6">
                  <Link href="/jobs">
                    <Button variant="primary">
                      浏览岗位
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {applications?.map((application) => (
              <ApplicationCard key={application.id} application={application} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
