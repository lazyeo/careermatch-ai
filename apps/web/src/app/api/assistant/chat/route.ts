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

    // 获取 API Keys
    const anthropicApiKey = process.env.ANTHROPIC_API_KEY
    const openaiApiKey = process.env.OPENAI_API_KEY

    if (!anthropicApiKey) {
      return NextResponse.json(
        {
          error: 'AI服务未配置',
          hint: '请在环境变量中配置 ANTHROPIC_API_KEY',
        },
        { status: 503 }
      )
    }

    if (!openaiApiKey) {
      console.warn('OPENAI_API_KEY not configured, memory features will be disabled')
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
    // MemoryManager 需要 OpenAI Key (用于 Embedding)
    // 如果没有 OpenAI Key，MemoryManager 初始化可能会失败或者无法工作，这里假设用户已配置
    // 或者我们需要处理 MemoryManager 的可选性

    // 注意：MemoryManager 构造函数签名可能是 (supabase, apiKey, baseUrl)
    // 让我们查看 MemoryManager 的定义，它是 (supabase, apiKey, baseUrl)
    const memoryManager = new MemoryManager(supabase, openaiApiKey || '', undefined)

    // 获取用户Profile
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    // AgentService 现在接收 (apiKey, memoryManager, supabase)
    const agentService = new AgentService(anthropicApiKey, memoryManager, supabase)

    // 4. 调用Agent
    // 注意：这里我们不等待Agent完成，而是返回流 (后续优化，现在还是等待)
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
