/**
 * AI 助手聊天 API (Agentic Version)
 *
 * POST /api/assistant/chat
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { AgentService, MemoryManager } from '@careermatch/ai-agent'

interface ChatRequestBody {
  message: string
  sessionId?: string
  context?: {
    jobId?: string
    resumeId?: string
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // 检查认证
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 })
    }

    // 获取 API Key (优先使用 Claude/Relay)
    const apiKey = process.env.CLAUDE_API_KEY || process.env.OPENAI_API_KEY
    const baseUrl = process.env.CLAUDE_BASE_URL || process.env.OPENAI_BASE_URL

    if (!apiKey) {
      return NextResponse.json(
        {
          error: 'AI服务未配置',
          hint: '请在环境变量中配置AI API密钥',
        },
        { status: 503 }
      )
    }

    // 解析请求
    const body = (await request.json()) as ChatRequestBody
    const { message, sessionId, context } = body

    if (!message || !message.trim()) {
      return NextResponse.json({ error: '消息不能为空' }, { status: 400 })
    }

    console.log('🤖 Processing agent chat request...')
    console.log(`📝 Message: ${message.substring(0, 100)}...`)

    // 初始化 Agent Service
    // 注意：我们直接传入 authenticated supabase client，这样 MemoryManager 会遵循 RLS
    const memoryManager = new MemoryManager(supabase, apiKey, baseUrl)
    // 获取用户Profile
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    const agentService = new AgentService(apiKey, baseUrl, memoryManager, supabase)

    // 4. 调用Agent
    // 注意：这里我们不等待Agent完成，而是返回流
    // 但由于AgentService目前不是流式的，我们先等待结果
    // TODO: Refactor AgentService to support streaming
    const response = await agentService.chat(
      user.id,
      message,
      {
        sessionId: sessionId || 'default', // 如果没有 sessionId，使用 default
        jobId: context?.jobId,
        resumeId: context?.resumeId,
        supabase, // Pass supabase client in context
      },
      userProfile // Pass user profile
    )

    console.log('✅ Successfully processed agent chat')

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error in POST /api/assistant/chat:', error)
    return NextResponse.json(
      { error: '处理请求时出错，请重试' },
      { status: 500 }
    )
  }
}
