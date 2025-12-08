/**
 * Custom Templates API
 * POST /api/templates/custom - 创建用户自定义模板
 * GET /api/templates/custom - 获取用户的自定义模板
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import type { TemplateConfig } from '@careermatch/shared'

/**
 * 创建自定义模板
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // 验证用户身份
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 解析请求体
    const body = await request.json()
    const { baseTemplateId, name, customConfig } = body as {
      baseTemplateId: string
      name: string
      customConfig: Partial<TemplateConfig>
    }

    // 验证必填字段
    if (!baseTemplateId || !name || !customConfig) {
      return NextResponse.json(
        { error: 'Missing required fields: baseTemplateId, name, customConfig' },
        { status: 400 }
      )
    }

    // 验证基础模板存在
    const { data: baseTemplate, error: baseError } = await supabase
      .from('resume_templates')
      .select('id, config')
      .eq('id', baseTemplateId)
      .eq('is_active', true)
      .single()

    if (baseError || !baseTemplate) {
      return NextResponse.json(
        { error: 'Base template not found' },
        { status: 404 }
      )
    }

    // 合并基础配置和自定义配置
    const mergedConfig = mergeTemplateConfig(
      baseTemplate.config as TemplateConfig,
      customConfig
    )

    // 创建自定义模板
    const { data: customTemplate, error: insertError } = await supabase
      .from('user_custom_templates')
      .insert({
        user_id: user.id,
        base_template_id: baseTemplateId,
        name,
        custom_config: mergedConfig,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Failed to create custom template:', insertError)
      return NextResponse.json(
        { error: 'Failed to create custom template' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      template: {
        id: customTemplate.id,
        name: customTemplate.name,
        baseTemplateId: customTemplate.base_template_id,
        config: customTemplate.custom_config,
        createdAt: customTemplate.created_at,
      },
    })
  } catch (error) {
    console.error('Custom template creation error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * 获取用户的自定义模板
 */
export async function GET() {
  try {
    const supabase = await createClient()

    // 验证用户身份
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 获取用户的自定义模板
    const { data: templates, error } = await supabase
      .from('user_custom_templates')
      .select(
        `
        *,
        base_template:resume_templates!base_template_id (
          id,
          name,
          category
        )
      `
      )
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Failed to fetch custom templates:', error)
      return NextResponse.json(
        { error: 'Failed to fetch custom templates' },
        { status: 500 }
      )
    }

    // 转换格式
    const transformedTemplates = (templates || []).map((t) => ({
      id: t.id,
      name: t.name,
      baseTemplateId: t.base_template_id,
      baseTemplateName: (t.base_template as { name: string } | null)?.name || 'Unknown',
      config: t.custom_config as TemplateConfig,
      createdAt: t.created_at,
      updatedAt: t.updated_at,
    }))

    return NextResponse.json({
      templates: transformedTemplates,
      total: transformedTemplates.length,
    })
  } catch (error) {
    console.error('Custom templates fetch error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * 合并模板配置
 */
function mergeTemplateConfig(
  base: TemplateConfig,
  custom: Partial<TemplateConfig>
): TemplateConfig {
  return {
    colors: {
      ...base.colors,
      ...(custom.colors || {}),
    },
    fonts: {
      ...base.fonts,
      ...(custom.fonts || {}),
    },
    layout: custom.layout || base.layout,
    sections_order: custom.sections_order || base.sections_order,
    spacing: {
      ...base.spacing,
      ...(custom.spacing || {}),
    },
  }
}
