/**
 * 个人资料中心页面
 *
 * 显示用户资料概览和完成度指示
 */

import { redirect } from 'next/navigation'
import { createClient, getCurrentUser } from '@/lib/supabase-server'
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, ProgressBar } from '@careermatch/ui'
import Link from 'next/link'
import { Award, Briefcase, CheckCircle2, FileText, GraduationCap, Lightbulb, Pencil, Upload, User, XCircle } from 'lucide-react'
import type { ReactNode } from 'react'
// Types imported for documentation purposes
// import type { FullProfile, ProfileCompleteness } from '@careermatch/shared'
import { getTranslations } from 'next-intl/server'

// 资料模块卡片组件
function ProfileSectionCard({
  title,
  count,
  isComplete,
  href,
  icon,
  recordsLabel,
}: {
  title: string
  count?: number
  isComplete: boolean
  href: string
  icon: ReactNode
  recordsLabel?: string
}) {
  return (
    <Link href={href}>
      <Card variant="interactive">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`rounded-md p-2 ${isComplete ? 'bg-sage-soft text-sage' : 'bg-surface-2 text-ink-4'}`}>
                {icon}
              </div>
              <div>
                <h3 className="font-medium text-ink">{title}</h3>
                {count !== undefined && recordsLabel && (
                  <p className="text-sm text-ink-3">{count} {recordsLabel}</p>
                )}
              </div>
            </div>
            <div>
              {isComplete ? (
                <CheckCircle2 className="h-5 w-5 text-sage" />
              ) : (
                <XCircle className="h-5 w-5 text-ink-4" />
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

export default async function ProfilePage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  const t = await getTranslations('profile')

  const supabase = await createClient()

  // 并行获取所有数据
  const [profileResult, workResult, educationResult, skillsResult, projectsResult, certificationsResult] = await Promise.all([
    supabase.from('user_profiles').select('*').eq('user_id', user.id).single(),
    supabase.from('work_experiences').select('id').eq('user_id', user.id),
    supabase.from('education_records').select('id').eq('user_id', user.id),
    supabase.from('user_skills').select('id').eq('user_id', user.id),
    supabase.from('user_projects').select('id').eq('user_id', user.id),
    supabase.from('user_certifications').select('id').eq('user_id', user.id),
  ])

  const profile = profileResult.data
  const workCount = workResult.data?.length || 0
  const educationCount = educationResult.data?.length || 0
  const skillsCount = skillsResult.data?.length || 0
  const projectsCount = projectsResult.data?.length || 0
  const certificationsCount = certificationsResult.data?.length || 0

  // 计算完成度
  const hasProfile = !!profile?.full_name
  const hasSummary = !!profile?.professional_summary
  const hasWork = workCount > 0
  const hasEducation = educationCount > 0
  const hasSkills = skillsCount > 0
  const hasProjects = projectsCount > 0

  let score = 0
  if (hasProfile) score += 20
  if (hasSummary) score += 15
  if (hasWork) score += 25
  if (hasEducation) score += 15
  if (hasSkills) score += 15
  if (hasProjects) score += 10

  return (
    <div className="space-y-8">
      <section className="rounded-lg border border-line bg-surface p-6 shadow-xs">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="cm-eyebrow">{t('profileModules')}</p>
            <h1 className="mt-2 font-display text-4xl leading-tight text-ink sm:text-5xl">{profile?.full_name || t('basicInfo')}</h1>
            <p className="mt-2 text-sm leading-6 text-ink-2">
              {score < 50 && t('completeHintLow')}
              {score >= 50 && score < 80 && t('completeHintMedium')}
              {score >= 80 && score < 100 && t('completeHintHigh')}
              {score === 100 && t('completeHintFull')}
            </p>
          </div>
          <Badge tone={score >= 80 ? 'sage' : score >= 50 ? 'ochre' : 'clay'} plain>
            {score}%
          </Badge>
        </div>
      </section>

        {/* 完成度卡片 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{t('completeness')}</CardTitle>
              <span className="font-display text-3xl text-brick">{score}%</span>
            </div>
          </CardHeader>
          <CardContent>
            <ProgressBar value={score} size="thick" />
            <p className="mt-3 text-sm text-ink-2">
              {score < 50 && t('completeHintLow')}
              {score >= 50 && score < 80 && t('completeHintMedium')}
              {score >= 80 && score < 100 && t('completeHintHigh')}
              {score === 100 && t('completeHintFull')}
            </p>
          </CardContent>
        </Card>

        {/* 快捷操作 */}
        <div className="flex flex-col gap-4 sm:flex-row">
          <Link href="/profile/edit" className="flex-1">
            <Button variant="primary" className="w-full" size="lg">
              <Pencil className="h-5 w-5" />
              {t('editProfile')}
            </Button>
          </Link>
          <Link href="/profile/upload" className="flex-1">
            <Button variant="secondary" className="w-full" size="lg">
              <Upload className="h-5 w-5" />
              {t('uploadResume')}
            </Button>
          </Link>
        </div>

        {/* 资料模块概览 */}
        <h2 className="mb-4 text-lg font-semibold text-ink">{t('profileModules')}</h2>
        <div className="grid gap-4">
          <ProfileSectionCard
            title={t('basicInfo')}
            isComplete={hasProfile}
            href="/profile/edit#basic"
            icon={
              <User className="h-5 w-5" />
            }
          />

          <ProfileSectionCard
            title={t('professionalSummary')}
            isComplete={hasSummary}
            href="/profile/edit#summary"
            icon={
              <FileText className="h-5 w-5" />
            }
          />

          <ProfileSectionCard
            title={t('workExperience')}
            count={workCount}
            isComplete={hasWork}
            href="/profile/edit#work"
            recordsLabel={t('records')}
            icon={
              <Briefcase className="h-5 w-5" />
            }
          />

          <ProfileSectionCard
            title={t('education')}
            count={educationCount}
            isComplete={hasEducation}
            href="/profile/edit#education"
            recordsLabel={t('records')}
            icon={
              <GraduationCap className="h-5 w-5" />
            }
          />

          <ProfileSectionCard
            title={t('skills')}
            count={skillsCount}
            isComplete={hasSkills}
            href="/profile/edit#skills"
            recordsLabel={t('records')}
            icon={
              <Lightbulb className="h-5 w-5" />
            }
          />

          <ProfileSectionCard
            title={t('projects')}
            count={projectsCount}
            isComplete={hasProjects}
            href="/profile/edit#projects"
            recordsLabel={t('records')}
            icon={
              <Briefcase className="h-5 w-5" />
            }
          />

          <ProfileSectionCard
            title={t('certifications')}
            count={certificationsCount}
            isComplete={certificationsCount > 0}
            href="/profile/edit#certifications"
            recordsLabel={t('records')}
            icon={
              <Award className="h-5 w-5" />
            }
          />
        </div>
    </div>
  )
}
