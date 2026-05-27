import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/supabase-server'
import { JobImportForm } from '../components/JobImportForm'
import Link from 'next/link'
import { Button } from '@careermatch/ui'
import { getTranslations } from 'next-intl/server'
import { ArrowLeft, PlusCircle } from 'lucide-react'

export default async function ImportJobPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login?redirect=/jobs/import')
  }

  const t = await getTranslations('jobs')

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-line bg-surface p-6 shadow-xs">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl">
              <p className="cm-eyebrow">{t('smartImport')}</p>
              <h1 className="mt-2 font-display text-4xl leading-tight text-ink">{t('smartImportJob')}</h1>
              <p className="mt-2 text-sm leading-6 text-ink-2">
                {t('smartImportDesc')}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/jobs/new">
                <Button variant="secondary">
                  <PlusCircle className="h-4 w-4" />
                  {t('manualCreate')}
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

      <JobImportForm />
    </div>
  )
}
