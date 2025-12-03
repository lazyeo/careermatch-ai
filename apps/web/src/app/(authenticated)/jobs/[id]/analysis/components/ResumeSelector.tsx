'use client'

import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@careermatch/ui'
import { FileText, Clock } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { zhCN, enUS } from 'date-fns/locale'
import { useTranslations, useLocale } from 'next-intl'

interface Resume {
  id: string
  title: string
  created_at: string
  updated_at: string
}

interface ResumeSelectorProps {
  resumes: Resume[]
  jobId: string
}

export function ResumeSelector({ resumes, jobId }: ResumeSelectorProps) {
  const router = useRouter()
  const t = useTranslations('analysis')
  const locale = useLocale()
  const dateLocale = locale === 'zh-CN' ? zhCN : enUS

  const handleSelectResume = (resumeId: string) => {
    router.push(`/jobs/${jobId}/analysis?resumeId=${resumeId}`)
  }

  return (
    <div className="grid md:grid-cols-2 gap-4">
      {resumes.map((resume) => (
        <Card
          key={resume.id}
          className="cursor-pointer hover:shadow-md transition-shadow hover:border-primary-300"
          onClick={() => handleSelectResume(resume.id)}
        >
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-primary-50 rounded-lg">
                <FileText className="w-5 h-5 text-primary-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">
                  {resume.title}
                </h3>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Clock className="w-3 h-3" />
                  <span>
                    {t('updatedAt')}{' '}
                    {formatDistanceToNow(new Date(resume.updated_at), {
                      addSuffix: true,
                      locale: dateLocale,
                    })}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
