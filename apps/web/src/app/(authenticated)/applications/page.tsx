import { createClient, getCurrentUser } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, EmptyState } from '@careermatch/ui'
import { ApplicationCard } from './components/ApplicationCard'
import { Briefcase, Inbox, PlusCircle } from 'lucide-react'

import { getTranslations } from 'next-intl/server'

export default async function ApplicationsPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login?redirect=/applications')
  }

  const t = await getTranslations('applications')

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
        salary_currency
      ),
      resumes:resume_id (
        id,
        title,
        content
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
    <div className="space-y-8">
      <section className="rounded-lg border border-line bg-surface p-6 shadow-xs">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="cm-eyebrow">{t('myApplications')}</p>
            <h1 className="mt-2 font-display text-4xl leading-tight text-ink sm:text-5xl">{t('myApplications')}</h1>
            <p className="mt-2 text-sm leading-6 text-ink-2">{t('noApplicationsDesc')}</p>
          </div>
          <Link href="/jobs">
            <Button variant="primary">
              <PlusCircle className="h-4 w-4" />
              {t('browseAndApply')}
            </Button>
          </Link>
        </div>
      </section>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="font-display text-4xl text-brick">{stats.total}</div>
                <div className="mt-1 text-sm text-ink-3">{t('totalApplications')}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="font-display text-4xl text-indigo">{activeApplications}</div>
                <div className="mt-1 text-sm text-ink-3">{t('inProgress')}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="font-display text-4xl text-ochre">{stats.interview_scheduled}</div>
                <div className="mt-1 text-sm text-ink-3">{t('interviewScheduled')}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="font-display text-4xl text-sage">{stats.offer_received}</div>
                <div className="mt-1 text-sm text-ink-3">{t('offerReceived')}</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Status Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>{t('statusBreakdown')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <StatusCount label={t('draft')} value={stats.draft} tone="ghost" />
              <StatusCount label={t('submitted')} value={stats.submitted} tone="indigo" />
              <StatusCount label={t('underReview')} value={stats.under_review} tone="ochre" />
              <StatusCount label={t('interviewScheduled')} value={stats.interview_scheduled} tone="brick" />
              <StatusCount label={t('offerReceived')} value={stats.offer_received} tone="sage" />
              <StatusCount label={t('rejected')} value={stats.rejected} tone="clay" />
              <StatusCount label={t('withdrawn')} value={stats.withdrawn} tone="ghost" />
              <StatusCount label={t('accepted')} value={stats.accepted} tone="sage" />
            </div>
          </CardContent>
        </Card>

        {/* Action Bar */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink">{t('myApplications')}</h2>
          <Link href="/jobs">
            <Button variant="secondary">
              <Briefcase className="h-4 w-4" />
              {t('browseAndApply')}
            </Button>
          </Link>
        </div>

        {/* Application List */}
        {applicationCount === 0 ? (
          <EmptyState
            icon={<Inbox className="h-5 w-5" />}
            title={t('noApplications')}
            description={t('noApplicationsDesc')}
            action={
              <Link href="/jobs">
                <Button variant="primary">{t('browseJobs')}</Button>
              </Link>
            }
          />
        ) : (
          <div className="space-y-4">
            {applications?.map((application) => (
              <ApplicationCard key={application.id} application={application} />
            ))}
          </div>
        )}
    </div>
  )
}

function StatusCount({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone: 'brick' | 'sage' | 'ochre' | 'clay' | 'indigo' | 'ghost'
}) {
  return (
    <div className="flex items-center justify-between rounded-md bg-surface-2 p-3">
      <Badge tone={tone} plain>{label}</Badge>
      <span className="font-display text-2xl text-ink">{value}</span>
    </div>
  )
}
