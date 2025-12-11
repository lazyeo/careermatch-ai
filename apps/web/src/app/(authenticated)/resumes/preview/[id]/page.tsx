import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import { ResumePreview } from './ResumePreview'
import type { TemplateConfig } from '@careermatch/shared'

// 默认模板配置
const DEFAULT_TEMPLATE_CONFIG: TemplateConfig = {
  colors: {
    primary: '#2563EB',
    secondary: '#3B82F6',
    text: '#1F2937',
    textLight: '#6B7280',
    background: '#FFFFFF',
    accent: '#DBEAFE',
  },
  fonts: {
    heading: 'system-ui',
    body: 'system-ui',
    headingSize: 14,
    bodySize: 10,
  },
  layout: 'single-column',
  sections_order: ['header', 'summary', 'skills', 'experience', 'projects', 'education', 'certifications'],
  spacing: {
    sectionGap: 15,
    itemGap: 10,
    lineHeight: 1.4,
  },
}

export default async function ResumePreviewPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?redirect=/resumes/preview/' + id)
  }

  // Fetch resume
  const { data: resume, error } = await supabase
    .from('resumes')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error || !resume) {
    redirect('/resumes')
  }

  // Fetch template config if template_id exists
  let templateConfig: TemplateConfig = DEFAULT_TEMPLATE_CONFIG
  let templateName = 'Default'

  if (resume.template_id) {
    const { data: template } = await supabase
      .from('resume_templates')
      .select('name, config')
      .eq('id', resume.template_id)
      .eq('is_active', true)
      .single()

    if (template) {
      templateConfig = template.config as TemplateConfig
      templateName = template.name
    }
  }

  return (
    <ResumePreview
      resume={resume}
      templateConfig={templateConfig}
      templateName={templateName}
    />
  )
}
