/**
 * 仪表盘页面（原型）
 *
 * 登录成功后的主页面
 * 后续将在Epic 6中完善数据可视化功能
 */

import { redirect } from 'next/navigation'
import { createClient, getCurrentUser } from '@/lib/supabase-server'
import { Badge, Button, Card, CardContent, EmptyState, ProgressBar } from '@careermatch/ui'
import Link from 'next/link'
import { Briefcase, FileText, Inbox, MapPin, PlusCircle, Sparkles, Target } from 'lucide-react'
import type { ReactNode } from 'react'

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

  // 获取最近的岗位
  const { data: recentJobs } = await supabase
    .from('jobs')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5)

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

  const stats = [
    { href: '/resumes', label: t('resumeCount'), value: resumeCount || 0, valueClassName: 'text-brick', icon: FileText },
    { href: '/jobs', label: t('savedJobs'), value: jobCount || 0, valueClassName: 'text-ochre', icon: Briefcase },
    { href: '/applications', label: t('totalApplications'), value: applicationCount || 0, valueClassName: 'text-sage', icon: Inbox },
    { href: '/applications', label: t('interviewScheduled'), value: interviewScheduledCount, valueClassName: 'text-indigo', icon: Target },
  ]

  return (
    <div className="space-y-8">
      <section className="rounded-lg border border-line bg-surface p-6 shadow-xs">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="cm-eyebrow">{t('title')}</p>
            <h1 className="mt-3 font-display text-4xl leading-tight text-ink sm:text-5xl">
              {profile?.full_name
                ? t('welcomeBack', { name: profile.full_name })
                : t('welcomeGuest')}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-2">
              {t('subtitle')}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/jobs/import">
              <Button variant="primary">
                <PlusCircle className="h-4 w-4" />
                {t('importJob')}
              </Button>
            </Link>
            <Link href="/assistant">
              <Button variant="secondary">
                <Sparkles className="h-4 w-4" />
                AI Copilot
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Link key={stat.label} href={stat.href}>
              <Card variant="interactive" className="h-full">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <span className="cm-eyebrow">{stat.label}</span>
                    <Icon className="h-4 w-4 text-ink-3" />
                  </div>
                  <div className={`mt-4 font-display text-4xl leading-none ${stat.valueClassName}`}>
                    {stat.value}
                  </div>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <DashboardAction href="/resumes" icon={<FileText className="h-4 w-4" />} title={t('resumeManagement')} description={t('resumeManagementDesc')} cta={t('manageResumes')} />
        <DashboardAction href="/jobs" icon={<Briefcase className="h-4 w-4" />} title={t('jobManagement')} description={t('jobManagementDesc')} cta={t('manageJobs')} />
        <DashboardAction href="/applications" icon={<Inbox className="h-4 w-4" />} title={t('applicationTracking')} description={t('applicationTrackingDesc')} cta={t('manageApplications')} />
      </section>

      {(applicationCount || 0) > 0 && (
        <Card>
          <CardContent className="p-5">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="cm-eyebrow">{t('applicationOverview')}</p>
                <h2 className="mt-2 text-lg font-semibold text-ink">{t('applicationTracking')}</h2>
              </div>
              <div className="grid flex-1 grid-cols-2 gap-3 md:grid-cols-4">
                <ApplicationMetric label={t('submitted')} value={applications?.filter((a) => a.status === 'submitted').length || 0} tone="indigo" />
                <ApplicationMetric label={t('underReview')} value={applications?.filter((a) => a.status === 'under_review').length || 0} tone="ochre" />
                <ApplicationMetric label={t('interviewScheduled')} value={interviewScheduledCount} tone="brick" />
                <ApplicationMetric label={t('offerReceived')} value={offerReceivedCount} tone="sage" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <section>
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <p className="cm-eyebrow">{t('recentJobs')}</p>
            <h2 className="mt-2 text-xl font-semibold text-ink">{t('jobManagement')}</h2>
          </div>
          <Link href="/jobs">
            <Button variant="ghost" size="sm">{t('viewAll')}</Button>
          </Link>
        </div>

        {recentJobs && recentJobs.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {recentJobs.map((job) => (
              <Link key={job.id} href={`/jobs/${job.id}`}>
                <Card variant="interactive" className="h-full">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="line-clamp-2 font-semibold leading-6 text-ink" title={job.title}>
                        {job.title}
                      </h3>
                      <Badge tone={job.status === 'applied' ? 'sage' : 'ghost'}>{job.status}</Badge>
                    </div>
                    <p className="mt-2 line-clamp-1 text-sm font-medium text-ink-2">{job.company}</p>
                    <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-ink-3">
                      <span>{new Date(job.created_at).toLocaleDateString()}</span>
                      {job.location && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {job.location}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Briefcase className="h-5 w-5" />}
            title={t('noRecentJobs')}
            action={
              <Link href="/jobs/import">
                <Button variant="primary" size="sm">{t('importJob')}</Button>
              </Link>
            }
          />
        )}
      </section>
    </div>
  )
}

function DashboardAction({
  href,
  icon,
  title,
  description,
  cta,
}: {
  href: string
  icon: ReactNode
  title: string
  description: string
  cta: string
}) {
  return (
    <Link href={href}>
      <Card variant="interactive" className="h-full">
        <CardContent className="flex h-full flex-col justify-between p-5">
          <div>
            <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-md bg-brick-soft text-brick">
              {icon}
            </div>
            <h3 className="text-base font-semibold text-ink">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-ink-3">{description}</p>
          </div>
          <Button variant="soft" size="sm" className="mt-5 w-full">{cta}</Button>
        </CardContent>
      </Card>
    </Link>
  )
}

function ApplicationMetric({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone: 'brick' | 'sage' | 'ochre' | 'indigo'
}) {
  const toneClassName = {
    brick: 'text-brick',
    sage: 'text-sage',
    ochre: 'text-ochre',
    indigo: 'text-indigo',
  }[tone]

  return (
    <div className="rounded-md bg-surface-2 p-3">
      <div className={`font-display text-3xl leading-none ${toneClassName}`}>{value}</div>
      <div className="mt-1 text-xs text-ink-3">{label}</div>
      <ProgressBar value={Math.min(100, value * 12)} tone={tone} size="thin" className="mt-3" />
    </div>
  )
}
