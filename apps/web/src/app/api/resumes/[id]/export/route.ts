/**
 * Resume Export API
 * 统一简历导出接口 - 支持PDF和HTML格式
 *
 * GET /api/resumes/[id]/export?format=pdf|html&template=template-id
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { getResumeRenderer } from '@/lib/resume-renderers'
import type {
  ResumeTemplate,
  OutputFormat,
  DatabaseResumeTemplate,
  TemplateConfig,
  ResumeContent,
} from '@careermatch/shared'

// 默认模板配置（当数据库中找不到模板时使用）
const DEFAULT_TEMPLATE: ResumeTemplate = {
  id: 'modern-blue',
  name: 'Modern Blue',
  description: 'Default professional template',
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
      bodySize: 10,
    },
    layout: 'single-column',
    sections_order: [
      'header',
      'summary',
      'skills',
      'experience',
      'projects',
      'education',
      'certifications',
    ],
    spacing: {
      sectionGap: 15,
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: resumeId } = await params
    const supabase = await createClient()

    // 1. 验证用户身份
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // 2. 获取查询参数
    const searchParams = request.nextUrl.searchParams
    const format = (searchParams.get('format') || 'pdf') as OutputFormat
    const templateId = searchParams.get('template') || 'modern-blue'

    // 验证格式
    if (format !== 'pdf' && format !== 'html') {
      return NextResponse.json(
        { error: 'Invalid format. Supported formats: pdf, html' },
        { status: 400 }
      )
    }

    // 3. 获取简历数据
    const { data: resume, error: resumeError } = await supabase
      .from('resumes')
      .select('*')
      .eq('id', resumeId)
      .eq('user_id', user.id)
      .single()

    if (resumeError || !resume) {
      return NextResponse.json(
        { error: 'Resume not found' },
        { status: 404 }
      )
    }

    // 4. 获取模板配置
    let template: ResumeTemplate = DEFAULT_TEMPLATE

    const { data: dbTemplate } = await supabase
      .from('resume_templates')
      .select('*')
      .eq('id', templateId)
      .eq('is_active', true)
      .single()

    if (dbTemplate) {
      template = transformTemplate(dbTemplate as DatabaseResumeTemplate)
    }

    // 5. 验证模板支持所需格式
    if (format === 'pdf' && !template.supportsPdf) {
      return NextResponse.json(
        { error: `Template "${template.name}" does not support PDF export` },
        { status: 400 }
      )
    }
    if (format === 'html' && !template.supportsHtml) {
      return NextResponse.json(
        { error: `Template "${template.name}" does not support HTML export` },
        { status: 400 }
      )
    }

    // 6. 解析简历内容
    const resumeContent = resume.content as ResumeContent

    // 7. 获取渲染器并渲染
    const renderer = getResumeRenderer(format, template)
    const output = await renderer.render(resumeContent)

    // 8. 返回响应
    if (format === 'pdf') {
      const fileName = `${resumeContent.personalInfo.fullName.replace(/\s+/g, '_')}_Resume.pdf`
      const pdfBuffer = output as Buffer

      return new NextResponse(pdfBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${fileName}"`,
          'Content-Length': pdfBuffer.length.toString(),
          'Cache-Control': 'no-cache',
        },
      })
    } else {
      // HTML格式
      return new NextResponse(output as string, {
        status: 200,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'no-cache',
        },
      })
    }
  } catch (error) {
    console.error('Resume export error:', error)

    return NextResponse.json(
      {
        error: 'Failed to export resume',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * POST方法 - 支持传入自定义内容和配置
 * 用于预览未保存的简历
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()

    // 验证用户身份
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // 解析请求体
    const body = await request.json()
    const {
      content,
      format = 'pdf',
      templateId = 'modern-blue',
      customConfig,
    } = body as {
      content: ResumeContent
      format?: OutputFormat
      templateId?: string
      customConfig?: Partial<TemplateConfig>
    }

    if (!content) {
      return NextResponse.json(
        { error: 'Resume content is required' },
        { status: 400 }
      )
    }

    // 获取模板
    let template: ResumeTemplate = DEFAULT_TEMPLATE

    const { data: dbTemplate } = await supabase
      .from('resume_templates')
      .select('*')
      .eq('id', templateId)
      .eq('is_active', true)
      .single()

    if (dbTemplate) {
      template = transformTemplate(dbTemplate as DatabaseResumeTemplate)
    }

    // 应用自定义配置
    if (customConfig) {
      template = {
        ...template,
        config: {
          ...template.config,
          ...customConfig,
        },
      }
    }

    // 渲染
    const renderer = getResumeRenderer(format, template)
    const output = await renderer.render(content)

    // 返回响应
    if (format === 'pdf') {
      const fileName = `${content.personalInfo.fullName.replace(/\s+/g, '_')}_Resume.pdf`
      const pdfBuffer = output as Buffer

      return new NextResponse(pdfBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${fileName}"`,
          'Content-Length': pdfBuffer.length.toString(),
        },
      })
    } else {
      return new NextResponse(output as string, {
        status: 200,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
        },
      })
    }
  } catch (error) {
    console.error('Resume export error:', error)

    return NextResponse.json(
      {
        error: 'Failed to export resume',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
