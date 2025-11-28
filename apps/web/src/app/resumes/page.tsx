import { createClient, getCurrentUser } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button, Card, CardContent, CardHeader, CardTitle } from '@careermatch/ui'
import { DeleteResumeButton } from './components/DeleteResumeButton'
import { AppHeader } from '@/components/AppHeader'
import { getTranslations, getLocale } from 'next-intl/server'

export default async function ResumesPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login?redirect=/resumes')
  }

  const t = await getTranslations('resumes')
  const locale = await getLocale()

  const supabase = await createClient()

  // Fetch user profile for header
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single()

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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <AppHeader user={{ email: user.email, name: profile?.full_name }} />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary-600">{resumeCount}</div>
                <div className="text-sm text-gray-600 mt-1">{t('totalResumes')}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-accent-600">
                  {resumes?.filter(r => r.is_primary).length || 0}
                </div>
                <div className="text-sm text-gray-600 mt-1">{t('defaultResume')}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-success-600">
                  {resumes?.[0] ? new Date(resumes[0].updated_at).toLocaleDateString(locale) : '-'}
                </div>
                <div className="text-sm text-gray-600 mt-1">{t('lastUpdated')}</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Bar */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-gray-900">{t('myResumes')}</h2>
          <Link href="/resumes/new">
            <Button variant="primary">
              + {t('createNew')}
            </Button>
          </Link>
        </div>

        {/* Resume List */}
        {resumeCount === 0 ? (
          <Card>
            <CardContent className="py-16">
              <div className="text-center">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">{t('noResumesTitle')}</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {t('noResumesDesc')}
                </p>
                <div className="mt-6">
                  <Link href="/resumes/new">
                    <Button variant="primary">
                      + {t('createNew')}
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {resumes?.map((resume) => (
              <Card key={resume.id} className="relative">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg">
                        {resume.title}
                      </CardTitle>
                      {resume.is_primary && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary-100 text-primary-800 mt-2">
                          {t('default')}
                        </span>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span>{t('version')}</span>
                      <span className="font-medium">v{resume.version}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{t('createdAt')}</span>
                      <span className="font-medium">
                        {new Date(resume.created_at).toLocaleDateString(locale)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>{t('lastUpdated')}</span>
                      <span className="font-medium">
                        {new Date(resume.updated_at).toLocaleDateString(locale)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-6 flex gap-2">
                    <Link href={`/resumes/${resume.id}`} className="flex-1">
                      <Button variant="outline" className="w-full">
                        {t('view')}
                      </Button>
                    </Link>
                    <Link href={`/resumes/${resume.id}/edit`} className="flex-1">
                      <Button variant="primary" className="w-full">
                        {t('edit')}
                      </Button>
                    </Link>
                    <DeleteResumeButton resumeId={resume.id} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
