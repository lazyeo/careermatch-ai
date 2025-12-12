/**
 * DOCX Export API
 * 导出简历为可编辑的 Word 文档
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, createClient } from '@/lib/supabase-server'
import { DOCXRenderer } from '@/lib/resume-renderers'
import type {
  ResumeContent,
  ResumeTemplate,
  DatabaseResumeTemplate,
  TemplateConfig,
} from '@careermatch/shared'

// 默认模板配置
const DEFAULT_TEMPLATE: ResumeTemplate = {
  id: 'default',
  name: 'Default',
  description: 'Default template',
  category: 'modern',
  config: {
    colors: {
      primary: '#2563EB',
      secondary: '#3B82F6',
      text: '#1F2937',
      textLight: '#6B7280',
      background: '#FFFFFF',
      accent: '#DBEAFE',
    },
    fonts: {
      heading: 'Helvetica-Bold',
      body: 'Helvetica',
      headingSize: 14,
      bodySize: 11,
    },
    layout: 'single-column',
    sections_order: ['header', 'summary', 'skills', 'experience', 'projects', 'education', 'certifications'],
    spacing: {
      sectionGap: 16,
      itemGap: 10,
      lineHeight: 1.4,
    },
  },
  previewUrl: null,
  supportsPdf: true,
  supportsHtml: true,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
}

/**
 * 转换数据库模板到应用模板类型
 */
function transformTemplate(dbTemplate: DatabaseResumeTemplate): ResumeTemplate {
  return {
    id: dbTemplate.id,
    name: dbTemplate.name,
    description: dbTemplate.description,
    category: dbTemplate.category,
    config: dbTemplate.config as TemplateConfig,
    previewUrl: dbTemplate.preview_url,
    supportsPdf: dbTemplate.supports_pdf,
    supportsHtml: dbTemplate.supports_html,
    isActive: dbTemplate.is_active,
    createdAt: new Date(dbTemplate.created_at),
    updatedAt: new Date(dbTemplate.updated_at),
  }
}

async function generateDOCX(
  request: NextRequest,
  resumeId: string
) {
  try {
    // 验证用户身份
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createClient()

    // 获取简历数据
    const { data: resume, error } = await supabase
      .from('resumes')
      .select('*')
      .eq('id', resumeId)
      .eq('user_id', user.id)
      .single()

    if (error || !resume) {
      return NextResponse.json(
        { error: 'Resume not found' },
        { status: 404 }
      )
    }

    // 准备简历数据
    const rawContent = resume.content as Record<string, unknown>

    const rawPersonalInfo = (rawContent.personalInfo || rawContent.personal_info || {}) as Record<string, unknown>
    const personalInfo = {
      fullName: (rawPersonalInfo.fullName || rawPersonalInfo.full_name || '') as string,
      email: (rawPersonalInfo.email || '') as string,
      phone: (rawPersonalInfo.phone || '') as string,
      location: (rawPersonalInfo.location || '') as string,
      linkedIn: (rawPersonalInfo.linkedIn || rawPersonalInfo.linkedin || '') as string,
      github: (rawPersonalInfo.github || '') as string,
    }

    const content: ResumeContent = {
      personalInfo,
      careerObjective: (rawContent.careerObjective || rawContent.career_objective || '') as string,
      skills: (rawContent.skills || []) as ResumeContent['skills'],
      workExperience: (rawContent.workExperience || rawContent.work_experience || []) as ResumeContent['workExperience'],
      projects: (rawContent.projects || []) as ResumeContent['projects'],
      education: (rawContent.education || []) as ResumeContent['education'],
      certifications: (rawContent.certifications || []) as ResumeContent['certifications'],
      interests: (rawContent.interests || []) as string[],
    }

    console.log('📝 DOCX Export - Resume content summary:')
    console.log(`  - Personal Info: ${content.personalInfo?.fullName || 'No name'}`)
    console.log(`  - Work Experience: ${content.workExperience?.length || 0} entries`)
    console.log(`  - Skills: ${content.skills?.length || 0} entries`)

    // 获取模板配置
    let template: ResumeTemplate = DEFAULT_TEMPLATE
    const templateId = resume.template_id

    if (templateId) {
      const { data: templateData } = await supabase
        .from('resume_templates')
        .select('*')
        .eq('id', templateId)
        .eq('is_active', true)
        .single()

      if (templateData) {
        console.log(`📋 Using template: ${templateData.name} (${templateId})`)
        template = transformTemplate(templateData as DatabaseResumeTemplate)
      }
    }

    // 生成 DOCX
    const renderer = new DOCXRenderer(template)
    const buffer = await renderer.render(content)
    console.log(`✅ DOCX generated: ${buffer.length} bytes`)

    // 生成文件名
    const dateStr = new Date().toISOString().split('T')[0]
    const safeFileName = `resume_${dateStr}.docx`
    const utf8FileName = `${resume.title.replace(/\s+/g, '_')}_${dateStr}.docx`

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${safeFileName}"; filename*=UTF-8''${encodeURIComponent(utf8FileName)}`,
        'Content-Length': buffer.length.toString(),
      },
    })
  } catch (error) {
    console.error('DOCX generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate DOCX', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// 支持GET方法
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  return generateDOCX(request, id)
}

// 支持POST方法
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  return generateDOCX(request, id)
}
