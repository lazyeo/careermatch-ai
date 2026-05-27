import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/supabase-server'
import { JobForm } from '../components/JobForm'
import Link from 'next/link'
import { Button } from '@careermatch/ui'
import { getTranslations } from 'next-intl/server'
import { ArrowLeft, Search } from 'lucide-react'

export default async function NewJobPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login?redirect=/jobs/new')
  }

  const t = await getTranslations('jobs')

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-line bg-surface p-6 shadow-xs">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl">
              <p className="cm-eyebrow">{t('manualCreate')}</p>
              <h1 className="mt-2 font-display text-4xl leading-tight text-ink">{t('addJob')}</h1>
              <p className="mt-2 text-sm leading-6 text-ink-2">
                {t('addJobDesc')}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/jobs/import">
                <Button variant="secondary">
                  <Search className="h-4 w-4" />
                  {t('smartImport')}
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

      <JobForm mode="create" />
    </div>
  )
}
