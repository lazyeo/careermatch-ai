/**
 * POST /api/jobs/[id]/process-full
 * 
 * 启动全流程异步处理（分析 + CV + CL）
 * 创建任务记录并触发后台处理，立即返回任务ID
 */

import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: jobId } = await params
    const supabase = await createClient()

    // 验证用户
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 解析请求参数
    const body = await request.json()
    const { resumeId } = body as { resumeId?: string }

    // 验证岗位存在
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('id')
      .eq('id', jobId)
      .eq('user_id', user.id)
      .single()

    if (jobError || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    // 创建处理任务记录
    const { data: task, error: taskError } = await supabase
      .from('processing_tasks')
      .insert({
        user_id: user.id,
        job_id: jobId,
        resume_id: resumeId || null,
        status: 'pending',
        current_step: 'queued',
        steps_completed: [],
      })
      .select()
      .single()

    if (taskError) {
      console.error('Failed to create task:', taskError)
      return NextResponse.json(
        { error: 'Failed to create task' },
        { status: 500 }
      )
    }

    console.log(`✅ Task created: ${task.id}`)

    // 触发后台处理 (fire and forget)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    fetch(`${baseUrl}/api/internal/process-job`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ taskId: task.id }),
    }).catch((error) => {
      console.error('Failed to trigger background processing:', error)
    })

    // 立即返回任务信息
    return NextResponse.json({
      taskId: task.id,
      status: 'pending',
      message: '处理已开始，您可以离开页面',
    })
  } catch (error) {
    console.error('Error in POST /api/jobs/[id]/process-full:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
