/**
 * 个人资料中心页面
 *
 * 显示用户资料概览和完成度指示
 */

import { redirect } from 'next/navigation'
import { createClient, getCurrentUser } from '@/lib/supabase-server'
import { Card, CardContent, CardHeader, CardTitle, Button } from '@careermatch/ui'
import Link from 'next/link'
// Types imported for documentation purposes
// import type { FullProfile, ProfileCompleteness } from '@careermatch/shared'
import { getTranslations } from 'next-intl/server'

// 完成度进度条组件
function ProgressBar({ percentage }: { percentage: number }) {
  return (
    <div className="w-full bg-neutral-200 rounded-full h-4">
      <div
        className="bg-primary-500 h-4 rounded-full transition-all duration-500"
        style={{ width: `${percentage}%` }}
      />
    </div>
  )
}

// 资料模块卡片组件
function ProfileSectionCard({
  title,
  count,
  isComplete,
  href,
  icon,
  recordsLabel,
}: {
  title: string
  count?: number
  isComplete: boolean
  href: string
  icon: React.ReactNode
  recordsLabel?: string
}) {
  return (
    <Link href={href}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${isComplete ? 'bg-green-100 text-green-600' : 'bg-neutral-100 text-neutral-400'}`}>
                {icon}
              </div>
              <div>
                <h3 className="font-medium text-neutral-900">{title}</h3>
                {count !== undefined && recordsLabel && (
                  <p className="text-sm text-neutral-500">{count} {recordsLabel}</p>
                )}
              </div>
            </div>
            <div>
              {isComplete ? (
                <span className="text-green-500">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </span>
              ) : (
                <span className="text-neutral-300">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z" clipRule="evenodd" />
                  </svg>
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

export default async function ProfilePage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  const t = await getTranslations('profile')

  const supabase = await createClient()

  // 并行获取所有数据
  const [profileResult, workResult, educationResult, skillsResult, projectsResult, certificationsResult] = await Promise.all([
    supabase.from('user_profiles').select('*').eq('user_id', user.id).single(),
    supabase.from('work_experiences').select('id').eq('user_id', user.id),
    supabase.from('education_records').select('id').eq('user_id', user.id),
    supabase.from('user_skills').select('id').eq('user_id', user.id),
    supabase.from('user_projects').select('id').eq('user_id', user.id),
    supabase.from('user_certifications').select('id').eq('user_id', user.id),
  ])

  const profile = profileResult.data
  const workCount = workResult.data?.length || 0
  const educationCount = educationResult.data?.length || 0
  const skillsCount = skillsResult.data?.length || 0
  const projectsCount = projectsResult.data?.length || 0
  const certificationsCount = certificationsResult.data?.length || 0

  // 计算完成度
  const hasProfile = !!profile?.full_name
  const hasSummary = !!profile?.professional_summary
  const hasWork = workCount > 0
  const hasEducation = educationCount > 0
  const hasSkills = skillsCount > 0
  const hasProjects = projectsCount > 0

  let score = 0
  if (hasProfile) score += 20
  if (hasSummary) score += 15
  if (hasWork) score += 25
  if (hasEducation) score += 15
  if (hasSkills) score += 15
  if (hasProjects) score += 10

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* 顶部导航栏 */}
      {/* AppHeader removed in favor of Sidebar layout */}

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 完成度卡片 */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{t('completeness')}</CardTitle>
              <span className="text-2xl font-bold text-primary-600">{score}%</span>
            </div>
          </CardHeader>
          <CardContent>
            <ProgressBar percentage={score} />
            <p className="mt-3 text-sm text-neutral-600">
              {score < 50 && t('completeHintLow')}
              {score >= 50 && score < 80 && t('completeHintMedium')}
              {score >= 80 && score < 100 && t('completeHintHigh')}
              {score === 100 && t('completeHintFull')}
            </p>
          </CardContent>
        </Card>

        {/* 快捷操作 */}
        <div className="flex gap-4 mb-8">
          <Link href="/profile/edit" className="flex-1">
            <Button className="w-full" size="lg">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              {t('editProfile')}
            </Button>
          </Link>
          <Link href="/profile/upload" className="flex-1">
            <Button variant="outline" className="w-full" size="lg">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              {t('uploadResume')}
            </Button>
          </Link>
        </div>

        {/* 资料模块概览 */}
        <h2 className="text-lg font-semibold text-neutral-900 mb-4">{t('profileModules')}</h2>
        <div className="grid gap-4">
          <ProfileSectionCard
            title={t('basicInfo')}
            isComplete={hasProfile}
            href="/profile/edit#basic"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            }
          />

          <ProfileSectionCard
            title={t('professionalSummary')}
            isComplete={hasSummary}
            href="/profile/edit#summary"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            }
          />

          <ProfileSectionCard
            title={t('workExperience')}
            count={workCount}
            isComplete={hasWork}
            href="/profile/edit#work"
            recordsLabel={t('records')}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            }
          />

          <ProfileSectionCard
            title={t('education')}
            count={educationCount}
            isComplete={hasEducation}
            href="/profile/edit#education"
            recordsLabel={t('records')}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M12 14l9-5-9-5-9 5 9 5z" />
                <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
              </svg>
            }
          />

          <ProfileSectionCard
            title={t('skills')}
            count={skillsCount}
            isComplete={hasSkills}
            href="/profile/edit#skills"
            recordsLabel={t('records')}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            }
          />

          <ProfileSectionCard
            title={t('projects')}
            count={projectsCount}
            isComplete={hasProjects}
            href="/profile/edit#projects"
            recordsLabel={t('records')}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            }
          />

          <ProfileSectionCard
            title={t('certifications')}
            count={certificationsCount}
            isComplete={certificationsCount > 0}
            href="/profile/edit#certifications"
            recordsLabel={t('records')}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            }
          />
        </div>
      </main>
    </div>
  )
}
