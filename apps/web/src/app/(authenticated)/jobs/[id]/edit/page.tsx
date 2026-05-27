import { redirect, notFound } from 'next/navigation'
import { getCurrentUser, createClient } from '@/lib/supabase-server'
import { JobForm } from '../../components/JobForm'
import Link from 'next/link'
import { Button } from '@careermatch/ui'
import { getTranslations } from 'next-intl/server'
import { ArrowLeft, Eye } from 'lucide-react'

export default async function EditJobPage({
  params,
}: {
  params: { id: string }
}) {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login?redirect=/jobs/' + params.id + '/edit')
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

  const t = await getTranslations('jobs')

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-line bg-surface p-6 shadow-xs">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl">
              <p className="cm-eyebrow">{job.company}</p>
              <h1 className="mt-2 font-display text-4xl leading-tight text-ink">{t('editJob')}</h1>
              <p className="mt-2 text-sm leading-6 text-ink-2">
                {t('editJobDesc')}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href={`/jobs/${params.id}`}>
                <Button variant="secondary">
                  <Eye className="h-4 w-4" />
                  {t('viewDetail')}
                </Button>
              </Link>
              <Link href="/jobs">
                <Button variant="ghost">
                  <ArrowLeft className="h-4 w-4" />
                  {t('backToList')}
                </Button>
              </Link>
            </div>
          </div>
      </section>

      <JobForm
          mode="edit"
          initialData={{
            id: job.id,
            title: job.title,
            company: job.company,
            location: job.location,
            job_type: job.job_type,
            salary_min: job.salary_min,
            salary_max: job.salary_max,
            salary_currency: job.salary_currency || 'NZD',
            description: job.description,
            requirements: job.requirements,
            benefits: job.benefits,
            source_url: job.source_url,
            posted_date: job.posted_date,
            deadline: job.deadline,
            status: job.status,
          }}
        />
    </div>
  )
}
