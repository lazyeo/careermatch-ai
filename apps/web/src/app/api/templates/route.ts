/**
 * Templates API
 * GET /api/templates - 获取所有可用模板
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import type {
  ResumeTemplate,
  DatabaseResumeTemplate,
  TemplateConfig,
} from '@careermatch/shared'

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

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // 获取查询参数
    const searchParams = request.nextUrl.searchParams
    const category = searchParams.get('category')
    const format = searchParams.get('format') // 'pdf' | 'html'

    // 构建查询
    let query = supabase
      .from('resume_templates')
      .select('*')
      .eq('is_active', true)
      .order('category')
      .order('name')

    // 按分类筛选
    if (category) {
      query = query.eq('category', category)
    }

    // 按支持格式筛选
    if (format === 'pdf') {
      query = query.eq('supports_pdf', true)
    } else if (format === 'html') {
      query = query.eq('supports_html', true)
    }

    const { data: templates, error } = await query

    if (error) {
      console.error('Failed to fetch templates:', error)
      return NextResponse.json(
        { error: 'Failed to fetch templates' },
        { status: 500 }
      )
    }

    // 转换模板格式
    const transformedTemplates = (templates || []).map((t) =>
      transformTemplate(t as DatabaseResumeTemplate)
    )

    // 按分类分组（可选）
    const grouped = transformedTemplates.reduce(
      (acc, template) => {
        if (!acc[template.category]) {
          acc[template.category] = []
        }
        acc[template.category].push(template)
        return acc
      },
      {} as Record<string, ResumeTemplate[]>
    )

    return NextResponse.json({
      templates: transformedTemplates,
      grouped,
      total: transformedTemplates.length,
    })
  } catch (error) {
    console.error('Templates API error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
