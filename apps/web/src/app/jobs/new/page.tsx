import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/supabase-server'
import { JobForm } from '../components/JobForm'
import Link from 'next/link'
import { Button } from '@careermatch/ui'
import { getTranslations } from 'next-intl/server'

export default async function NewJobPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login?redirect=/jobs/new')
  }

  const t = await getTranslations('jobs')

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{t('addJob')}</h1>
              <p className="text-sm text-gray-600 mt-1">
                {t('addJobDesc')}
              </p>
            </div>
            <div className="flex gap-3">
              <Link href="/jobs/import">
                <Button variant="outline">{t('smartImport')}</Button>
              </Link>
              <Link href="/jobs">
                <Button variant="outline">{t('backToList')}</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <JobForm mode="create" />
      </main>
    </div>
  )
}
