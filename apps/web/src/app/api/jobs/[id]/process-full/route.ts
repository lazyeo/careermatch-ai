/**
 * POST /api/jobs/[id]/process-full
 * 
 * 启动全流程异步处理（分析 + CV + CL）
 * 创建任务记录并触发后台处理，立即返回任务ID
 */

import { NextRequest, NextResponse } from 'next/server'
import { tasks } from '@trigger.dev/sdk/v3'

import { createClient } from '@/lib/supabase-server'
import { enqueueProcessJobPipeline } from '@/lib/jobs/enqueue-process-job-pipeline'

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

    const task = await enqueueProcessJobPipeline({
      supabase,
      userId: user.id,
      jobId,
      resumeId: resumeId || null,
      mode: 'full_artifacts',
      triggerPipelineTask: async (payload) => {
        await tasks.trigger('process-job-pipeline', payload)
      },
    })

    // 立即返回任务信息
    return NextResponse.json({
      taskId: task.taskId,
      status: task.status,
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
