import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'
import {
  parseJobContent,
  parseJobFromUrl,
  type ParsedJobData,
} from '@/lib/job-parser'

/**
 * POST /api/jobs/import
 * 导入岗位信息（从URL或文本内容）
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { url, content, save_immediately } = body as {
      url?: string
      content?: string
      save_immediately?: boolean
    }

    // 必须提供URL或内容
    if (!url && !content) {
      return NextResponse.json(
        { error: 'Please provide a URL or job content' },
        { status: 400 }
      )
    }

    let parsedData: ParsedJobData

    try {
      if (url) {
        // 从URL解析
        console.log(`📥 Importing job from URL: ${url}`)
        parsedData = await parseJobFromUrl(url)
        // 保存来源URL
        parsedData.application_url = parsedData.application_url || url
      } else if (content) {
        // 从文本内容解析
        console.log(`📝 Parsing job from content (${content.length} chars)`)
        parsedData = await parseJobContent(content)
      } else {
        throw new Error('No input provided')
      }

      // 验证必需字段
      if (!parsedData.title || !parsedData.company) {
        return NextResponse.json(
          {
            error: 'Could not extract job title or company name',
            parsed_data: parsedData,
          },
          { status: 422 }
        )
      }

      // 如果需要立即保存
      if (save_immediately) {
        const { data: job, error } = await supabase
          .from('jobs')
          .insert({
            user_id: user.id,
            title: parsedData.title,
            company: parsedData.company,
            location: parsedData.location || null,
            job_type: parsedData.job_type || null,
            salary_min: parsedData.salary_min || null,
            salary_max: parsedData.salary_max || null,
            salary_currency: parsedData.salary_currency || 'NZD',
            description: parsedData.description || null,
            requirements: parsedData.requirements || null,
            benefits: parsedData.benefits || null,
            source_url: url || null,
            posted_date: parsedData.posted_date || null,
            deadline: parsedData.deadline || null,
            status: 'saved',
          })
          .select()
          .single()

        if (error) {
          console.error('Error saving job:', error)
          return NextResponse.json(
            { error: 'Failed to save job', parsed_data: parsedData },
            { status: 500 }
          )
        }

        return NextResponse.json(
          {
            success: true,
            job_id: job.id,
            parsed_data: parsedData,
            message: 'Job imported and saved successfully',
          },
          { status: 201 }
        )
      }

      // 返回解析结果供用户确认
      return NextResponse.json({
        success: true,
        parsed_data: parsedData,
        message: 'Job parsed successfully. Review and save.',
      })
    } catch (parseError) {
      console.error('❌ Error parsing job:', parseError)
      return NextResponse.json(
        { error: `解析失败: ${(parseError as Error).message}` },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error in POST /api/jobs/import:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
