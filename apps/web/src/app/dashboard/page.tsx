/**
 * 仪表盘页面（原型）
 *
 * 登录成功后的主页面
 * 后续将在Epic 6中完善数据可视化功能
 */

import { redirect } from 'next/navigation'
import { createClient, getCurrentUser } from '@/lib/supabase-server'
import { Card, CardContent, CardHeader, CardTitle, Button } from '@careermatch/ui'
import Link from 'next/link'

export default async function DashboardPage() {
  const user = await getCurrentUser()

  // 未登录用户重定向到登录页
  if (!user) {
    redirect('/login')
  }

  // 获取用户profile信息和统计数据
  const supabase = await createClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // 获取简历数量
  const { count: resumeCount } = await supabase
    .from('resumes')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  // 获取岗位数量
  const { count: jobCount } = await supabase
    .from('jobs')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  // 获取申请数量
  const { count: applicationCount } = await supabase
    .from('applications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  // 获取面试数量（暂未使用）
  // const { count: interviewCount } = await supabase
  //   .from('interviews')
  //   .select('*', { count: 'exact', head: true })
  //   .eq('user_id', user.id)

  // 获取各状态的申请数量
  const { data: applications } = await supabase
    .from('applications')
    .select('status')
    .eq('user_id', user.id)

  const interviewScheduledCount = applications?.filter(
    (a) => a.status === 'interview_scheduled'
  ).length || 0

  const offerReceivedCount = applications?.filter(
    (a) => a.status === 'offer_received'
  ).length || 0

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* 顶部导航栏 */}
      <header className="bg-white border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-primary-600">
                CareerMatch AI
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-neutral-600">
                {profile?.full_name || user.email}
              </span>
              <form action="/auth/signout" method="post">
                <Button type="submit" variant="outline" size="sm">
                  退出登录
                </Button>
              </form>
            </div>
          </div>
        </div>
      </header>

      {/* 主要内容区域 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 欢迎区域 */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-neutral-900 mb-2">
            欢迎回来，{profile?.full_name || '求职者'}！
          </h2>
          <p className="text-neutral-600">
            开始管理您的简历和求职申请
          </p>
        </div>

        {/* 功能卡片网格 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* 简历管理卡片 */}
          <Link href="/resumes">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-2xl">📝</span>
                  简历管理
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-neutral-600 mb-4">
                  创建、编辑和管理您的简历
                </p>
                <Button variant="primary" size="sm" className="w-full">
                  管理简历
                </Button>
              </CardContent>
            </Card>
          </Link>

          {/* 岗位管理卡片 */}
          <Link href="/jobs">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-2xl">💼</span>
                  岗位管理
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-neutral-600 mb-4">
                  浏览和保存感兴趣的岗位
                </p>
                <Button variant="primary" size="sm" className="w-full">
                  管理岗位
                </Button>
              </CardContent>
            </Card>
          </Link>

          {/* 申请追踪卡片 */}
          <Link href="/applications">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-2xl">📊</span>
                  申请追踪
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-neutral-600 mb-4">
                  追踪您的申请进度和面试安排
                </p>
                <Button variant="primary" size="sm" className="w-full">
                  管理申请
                </Button>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* 快速统计 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Link href="/resumes">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-primary-600 mb-1">
                  {resumeCount || 0}
                </div>
                <div className="text-sm text-neutral-600">简历数量</div>
              </CardContent>
            </Card>
          </Link>
          <Link href="/jobs">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-accent-600 mb-1">
                  {jobCount || 0}
                </div>
                <div className="text-sm text-neutral-600">保存的岗位</div>
              </CardContent>
            </Card>
          </Link>
          <Link href="/applications">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-success-600 mb-1">
                  {applicationCount || 0}
                </div>
                <div className="text-sm text-neutral-600">总申请数</div>
              </CardContent>
            </Card>
          </Link>
          <Link href="/applications">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-warning-600 mb-1">
                  {interviewScheduledCount}
                </div>
                <div className="text-sm text-neutral-600">面试安排</div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* 申请状态快速概览 */}
        {(applicationCount || 0) > 0 && (
          <Card className="mt-8 border-blue-200">
            <CardHeader>
              <CardTitle className="text-blue-900">申请状态概览</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {applications?.filter((a) => a.status === 'submitted').length || 0}
                  </div>
                  <div className="text-xs text-blue-700 mt-1">已提交</div>
                </div>
                <div className="text-center p-3 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">
                    {applications?.filter((a) => a.status === 'under_review').length || 0}
                  </div>
                  <div className="text-xs text-yellow-700 mt-1">审核中</div>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {interviewScheduledCount}
                  </div>
                  <div className="text-xs text-purple-700 mt-1">面试安排</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {offerReceivedCount}
                  </div>
                  <div className="text-xs text-green-700 mt-1">已获录取</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 开发提示 */}
        <Card className="mt-8 bg-success-50 border-success-200">
          <CardHeader>
            <CardTitle className="text-success-700">🚀 Sprint 5 开发中</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-neutral-700">
              <strong>已完成：</strong>简历管理 + 岗位管理 + AI智能匹配 + 申请追踪系统
            </p>
            <p className="text-sm text-neutral-700 mt-2">
              <strong>新功能：</strong>申请列表、申请详情、时间线可视化、状态管理
            </p>
            <p className="text-xs text-neutral-500 mt-2">
              当前状态：<strong>Sprint 5 - 申请追踪系统（前端完成）</strong> ✅
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
