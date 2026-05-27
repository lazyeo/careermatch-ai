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
    <div className="min-h-screen bg-paper">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto max-w-5xl px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="cm-eyebrow">{t('title')}</p>
              <h1 className="font-display text-3xl font-semibold text-ink">{t('editResume')}</h1>
              <p className="mt-1 text-sm text-ink-3">
                {t('editResumeDesc')}
              </p>
            </div>
            <div className="flex gap-2">
              <Link href={`/resumes/${params.id}`}>
                <Button variant="secondary">{t('preview')}</Button>
              </Link>
              <Link href="/resumes">
                <Button variant="ghost">{t('backToList')}</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
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
