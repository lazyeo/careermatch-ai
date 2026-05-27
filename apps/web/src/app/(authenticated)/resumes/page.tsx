import { createClient, getCurrentUser } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, EmptyState } from '@careermatch/ui'
import { DeleteResumeButton } from './components/DeleteResumeButton'
import { FileText, PlusCircle, Star } from 'lucide-react'

import { getTranslations, getLocale } from 'next-intl/server'

export default async function ResumesPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login?redirect=/resumes')
  }

  const t = await getTranslations('resumes')
  const locale = await getLocale()

  const supabase = await createClient()



  // Fetch user's resumes
  const { data: resumes, error } = await supabase
    .from('resumes')
    .select('*')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })

  if (error) {
    console.error('Error fetching resumes:', error)
  }

  const resumeCount = resumes?.length || 0

  return (
    <div className="space-y-8">
      <section className="rounded-lg border border-line bg-surface p-6 shadow-xs">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="cm-eyebrow">{t('myResumes')}</p>
            <h1 className="mt-2 font-display text-4xl leading-tight text-ink sm:text-5xl">{t('myResumes')}</h1>
            <p className="mt-2 text-sm leading-6 text-ink-2">{t('noResumesDesc')}</p>
          </div>
          <Link href="/resumes/new">
            <Button variant="primary">
              <PlusCircle className="h-4 w-4" />
              {t('createNew')}
            </Button>
          </Link>
        </div>
      </section>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="font-display text-4xl text-brick">{resumeCount}</div>
                <div className="mt-1 text-sm text-ink-3">{t('totalResumes')}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="font-display text-4xl text-ochre">
                  {resumes?.filter(r => r.is_primary).length || 0}
                </div>
                <div className="mt-1 text-sm text-ink-3">{t('defaultResume')}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="font-display text-3xl text-sage">
                  {resumes?.[0] ? new Date(resumes[0].updated_at).toLocaleDateString(locale) : '-'}
                </div>
                <div className="mt-1 text-sm text-ink-3">{t('lastUpdated')}</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Bar */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink">{t('myResumes')}</h2>
          <Link href="/resumes/new">
            <Button variant="secondary">
              <PlusCircle className="h-4 w-4" />
              {t('createNew')}
            </Button>
          </Link>
        </div>

        {/* Resume List */}
        {resumeCount === 0 ? (
          <EmptyState
            icon={<FileText className="h-5 w-5" />}
            title={t('noResumesTitle')}
            description={t('noResumesDesc')}
            action={
              <Link href="/resumes/new">
                <Button variant="primary">
                  <PlusCircle className="h-4 w-4" />
                  {t('createNew')}
                </Button>
              </Link>
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {resumes?.map((resume) => (
              <Card key={resume.id} variant="interactive" className="relative">
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <CardTitle className="text-lg">
                        {resume.title}
                      </CardTitle>
                      {resume.is_primary && (
                        <Badge tone="brick" className="mt-2">
                          <Star className="h-3 w-3" />
                          {t('default')}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm text-ink-2">
                    <div className="flex justify-between">
                      <span>{t('version')}</span>
                      <span className="font-medium text-ink">v{resume.version}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{t('createdAt')}</span>
                      <span className="font-medium text-ink">
                        {new Date(resume.created_at).toLocaleDateString(locale)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>{t('lastUpdated')}</span>
                      <span className="font-medium text-ink">
                        {new Date(resume.updated_at).toLocaleDateString(locale)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-3 gap-2">
                    <Link href={`/resumes/${resume.id}`}>
                      <Button variant="secondary" size="sm" className="w-full">
                        {t('view')}
                      </Button>
                    </Link>
                    <Link href={`/resumes/${resume.id}/edit`}>
                      <Button variant="primary" size="sm" className="w-full">
                        {t('edit')}
                      </Button>
                    </Link>
                    <DeleteResumeButton resumeId={resume.id} className="w-full" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
    </div>
  )
}
