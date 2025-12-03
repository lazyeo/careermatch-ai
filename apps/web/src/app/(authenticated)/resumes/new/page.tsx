import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/supabase-server'
import { ResumeForm } from '../components/ResumeForm'
import Link from 'next/link'
import { Button } from '@careermatch/ui'
import { getTranslations } from 'next-intl/server'

export default async function NewResumePage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login?redirect=/resumes/new')
  }

  const t = await getTranslations('resumes')

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{t('createNewResume')}</h1>
              <p className="text-sm text-gray-600 mt-1">
                {t('createResumeDesc')}
              </p>
            </div>
            <Link href="/resumes">
              <Button variant="outline">{t('backToList')}</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ResumeForm mode="create" />
      </main>
    </div>
  )
}
