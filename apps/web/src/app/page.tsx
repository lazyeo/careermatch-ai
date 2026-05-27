import Link from 'next/link'
import { getCurrentUser } from '@/lib/supabase-server'
import { Badge, Button, Card, CardContent } from '@careermatch/ui'
import { getTranslations } from 'next-intl/server'
import { Briefcase, FileText, Inbox, Sparkles } from 'lucide-react'
import type { ReactNode } from 'react'

export default async function Home() {
  const user = await getCurrentUser()
  const t = await getTranslations('home')

  return (
    <main className="min-h-screen bg-paper">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <section className="grid min-h-[76vh] items-center gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(380px,0.75fr)]">
          <div>
            <Badge tone="brick" plain>{t('title')}</Badge>
            <h1 className="mt-5 max-w-4xl font-display text-5xl leading-none text-ink sm:text-7xl">
              {t('welcomeTo')} {t('title')}
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-ink-2">
              {t('tagline')}
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              {user ? (
                <Link href="/dashboard">
                  <Button variant="primary" size="lg">
                    {t('goToDashboard')}
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/register">
                    <Button variant="primary" size="lg">
                      {t('register')}
                    </Button>
                  </Link>
                  <Link href="/login">
                    <Button variant="secondary" size="lg">
                      {t('login')}
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>

        <Card className="overflow-hidden" variant="accent">
          <CardContent className="p-6">
            <div className="mb-5 flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-md bg-brick-soft text-brick">
                <Sparkles className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-ink">{t('features.jobMatching.title')}</p>
                <p className="text-xs text-ink-3">{t('features.resumeBuilder.title')}</p>
              </div>
            </div>
            <h2 className="font-display text-4xl leading-tight text-ink">{t('features.jobMatching.title')}</h2>
            <p className="mt-4 text-sm leading-6 text-ink-2">{t('features.jobMatching.description')}</p>
            <div className="mt-6 rounded-lg border border-line bg-surface-2 p-4">
              <div className="mb-3 text-xs text-ink-3">CareerMatch analysis workspace</div>
              <div className="space-y-2">
                <div className="h-2 rounded-full bg-brick-soft" />
                <div className="h-2 w-5/6 rounded-full bg-sage-soft" />
                <div className="h-2 w-2/3 rounded-full bg-ochre-soft" />
              </div>
              <div className="mt-4 text-xs font-medium text-brick">{t('status')}</div>
            </div>
          </CardContent>
        </Card>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <Feature icon={<FileText className="h-5 w-5" />} title={t('features.resumeBuilder.title')} description={t('features.resumeBuilder.description')} />
          <Feature icon={<Briefcase className="h-5 w-5" />} title={t('features.jobMatching.title')} description={t('features.jobMatching.description')} />
          <Feature icon={<Inbox className="h-5 w-5" />} title={t('features.applicationTracking.title')} description={t('features.applicationTracking.description')} />
        </section>

        <div className="mt-10 text-center">
          <p className="text-sm text-ink-3">
            {t('status')}
          </p>
        </div>
      </div>
    </main>
  )
}

function Feature({
  icon,
  title,
  description,
}: {
  icon: ReactNode
  title: string
  description: string
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-md bg-brick-soft text-brick">
          {icon}
        </div>
        <h3 className="text-lg font-semibold text-ink">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-ink-2">{description}</p>
      </CardContent>
    </Card>
  )
}
