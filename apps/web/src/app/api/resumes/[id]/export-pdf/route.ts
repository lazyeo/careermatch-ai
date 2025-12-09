import { NextRequest, NextResponse } from 'next/server'
import { renderToStream, DocumentProps } from '@react-pdf/renderer'
import type { ReactElement } from 'react'
import { getCurrentUser, createClient } from '@/lib/supabase-server'
import { ResumePDFTemplate } from '@/components/ResumePDFTemplate'
import type {
  ResumeContent,
  ResumeTemplate,
  DatabaseResumeTemplate,
  TemplateConfig,
} from '@careermatch/shared'
import { PDFRenderer } from '@/lib/resume-renderers'

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

async function generatePDF(
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

    // 准备简历数据 - 处理 snake_case 和 camelCase 字段名兼容
    const rawContent = resume.content as Record<string, unknown>

    // Handle personalInfo field names
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

    let buffer: Buffer

    // 检查是否有指定模板
    const templateId = resume.template_id
    if (templateId) {
      // 获取模板配置
      const { data: templateData } = await supabase
        .from('resume_templates')
        .select('*')
        .eq('id', templateId)
        .eq('is_active', true)
        .single()

      if (templateData) {
        // 使用模板渲染器
        console.log(`📋 Using template: ${templateData.name} (${templateId})`)
        const template = transformTemplate(templateData as DatabaseResumeTemplate)
        const renderer = new PDFRenderer(template)
        buffer = await renderer.render(content)
      } else {
        // 模板不存在，使用默认模板
        console.log('⚠️ Template not found, using default template')
        buffer = await renderDefaultTemplate(resume.title, content)
      }
    } else {
      // 没有指定模板，使用默认模板
      buffer = await renderDefaultTemplate(resume.title, content)
    }

    // 返回PDF文件
    // 使用ASCII安全的文件名作为fallback，同时提供UTF-8编码的文件名
    const dateStr = new Date().toISOString().split('T')[0]
    const safeFileName = `resume_${dateStr}.pdf`
    const utf8FileName = `${resume.title.replace(/\s+/g, '_')}_${dateStr}.pdf`

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        // RFC 5987: 使用filename作为ASCII fallback，filename*作为UTF-8编码的实际文件名
        'Content-Disposition': `attachment; filename="${safeFileName}"; filename*=UTF-8''${encodeURIComponent(utf8FileName)}`,
        'Content-Length': buffer.length.toString(),
      },
    })
  } catch (error) {
    console.error('PDF generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    )
  }
}

/**
 * 使用默认模板渲染PDF
 */
async function renderDefaultTemplate(title: string, content: ResumeContent): Promise<Buffer> {
  const resumeData = { title, content }
  const stream = await renderToStream(
    ResumePDFTemplate({ resume: resumeData }) as ReactElement<DocumentProps>
  )

  const chunks: Buffer[] = []
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  }
  return Buffer.concat(chunks)
}

// 支持GET方法
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  return generatePDF(request, id)
}

// 支持POST方法（前端调用的是POST）
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  return generatePDF(request, id)
}
