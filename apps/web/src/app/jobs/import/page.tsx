import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/supabase-server'
import { JobImportForm } from '../components/JobImportForm'
import Link from 'next/link'
import { Button } from '@careermatch/ui'
import { getTranslations } from 'next-intl/server'

export default async function ImportJobPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login?redirect=/jobs/import')
  }

  const t = await getTranslations('jobs')

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{t('smartImportJob')}</h1>
              <p className="text-sm text-gray-600 mt-1">
                {t('smartImportDesc')}
              </p>
            </div>
            <div className="flex gap-3">
              <Link href="/jobs/new">
                <Button variant="outline">{t('manualCreate')}</Button>
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
        <JobImportForm />
      </main>
    </div>
  )
}
