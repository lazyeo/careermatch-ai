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

import { getTranslations } from 'next-intl/server'

export default async function DashboardPage() {
  const user = await getCurrentUser()

  // 未登录用户重定向到登录页
  if (!user) {
    redirect('/login')
  }

  const t = await getTranslations('dashboard')

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
      {/* 顶部导航栏 - 已移除，使用 Sidebar 布局 */}

      {/* 主要内容区域 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 欢迎区域 */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-neutral-900 mb-2">
            {profile?.full_name
              ? t('welcomeBack', { name: profile.full_name })
              : t('welcomeGuest')}
          </h2>
          <p className="text-neutral-600">
            {t('subtitle')}
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
                  {t('resumeManagement')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-neutral-600 mb-4">
                  {t('resumeManagementDesc')}
                </p>
                <Button variant="primary" size="sm" className="w-full">
                  {t('manageResumes')}
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
                  {t('jobManagement')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-neutral-600 mb-4">
                  {t('jobManagementDesc')}
                </p>
                <Button variant="primary" size="sm" className="w-full">
                  {t('manageJobs')}
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
                  {t('applicationTracking')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-neutral-600 mb-4">
                  {t('applicationTrackingDesc')}
                </p>
                <Button variant="primary" size="sm" className="w-full">
                  {t('manageApplications')}
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
                <div className="text-sm text-neutral-600">{t('resumeCount')}</div>
              </CardContent>
            </Card>
          </Link>
          <Link href="/jobs">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-accent-600 mb-1">
                  {jobCount || 0}
                </div>
                <div className="text-sm text-neutral-600">{t('savedJobs')}</div>
              </CardContent>
            </Card>
          </Link>
          <Link href="/applications">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-success-600 mb-1">
                  {applicationCount || 0}
                </div>
                <div className="text-sm text-neutral-600">{t('totalApplications')}</div>
              </CardContent>
            </Card>
          </Link>
          <Link href="/applications">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-warning-600 mb-1">
                  {interviewScheduledCount}
                </div>
                <div className="text-sm text-neutral-600">{t('interviewScheduled')}</div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* 申请状态快速概览 */}
        {(applicationCount || 0) > 0 && (
          <Card className="mt-8 border-blue-200">
            <CardHeader>
              <CardTitle className="text-blue-900">{t('applicationOverview')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {applications?.filter((a) => a.status === 'submitted').length || 0}
                  </div>
                  <div className="text-xs text-blue-700 mt-1">{t('submitted')}</div>
                </div>
                <div className="text-center p-3 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">
                    {applications?.filter((a) => a.status === 'under_review').length || 0}
                  </div>
                  <div className="text-xs text-yellow-700 mt-1">{t('underReview')}</div>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {interviewScheduledCount}
                  </div>
                  <div className="text-xs text-purple-700 mt-1">{t('interviewScheduled')}</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {offerReceivedCount}
                  </div>
                  <div className="text-xs text-green-700 mt-1">{t('offerReceived')}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 开发提示 */}
        <Card className="mt-8 bg-success-50 border-success-200">
          <CardHeader>
            <CardTitle className="text-success-700">🚀 {t('sprintNotice')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-neutral-700">
              <strong>{t('completedFeatures')}</strong>{t('completedFeaturesDesc')}
            </p>
            <p className="text-sm text-neutral-700 mt-2">
              <strong>{t('newFeatures')}</strong>{t('newFeaturesDesc')}
            </p>
            <p className="text-xs text-neutral-500 mt-2">
              {t('currentStatus')}<strong>{t('currentStatusDesc')}</strong> ✅
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
