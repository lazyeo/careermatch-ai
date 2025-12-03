import { redirect, notFound } from 'next/navigation'
import { getCurrentUser, createClient } from '@/lib/supabase-server'
import { ResumeForm } from '../../components/ResumeForm'
import Link from 'next/link'
import { Button } from '@careermatch/ui'
import { getTranslations } from 'next-intl/server'

export default async function EditResumePage({
  params,
}: {
  params: { id: string }
}) {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login?redirect=/resumes/' + params.id + '/edit')
  }

  const supabase = await createClient()

  // Fetch the resume
  const { data: resume, error } = await supabase
    .from('resumes')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()

  if (error || !resume) {
    notFound()
  }

  const t = await getTranslations('resumes')

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{t('editResume')}</h1>
              <p className="text-sm text-gray-600 mt-1">
                {t('editResumeDesc')}
              </p>
            </div>
            <div className="flex gap-2">
              <Link href={`/resumes/${params.id}`}>
                <Button variant="outline">{t('preview')}</Button>
              </Link>
              <Link href="/resumes">
                <Button variant="outline">{t('backToList')}</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ResumeForm
          mode="edit"
          initialData={{
            id: resume.id,
            title: resume.title,
            content: resume.content,
          }}
        />
      </main>
    </div>
  )
}
