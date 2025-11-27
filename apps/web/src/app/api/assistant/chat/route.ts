/**
 * AI 助手聊天 API
 *
 * POST /api/assistant/chat
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import {
  createAIClient,
  isAnyAIConfigured,
  getBestModel,
  TEMPERATURE_PRESETS,
} from '@/lib/ai-providers'
import {
  ASSISTANT_CHAT_SYSTEM_PROMPT,
  formatContextForChat,
  parseAssistantChatOutput,
} from '@/lib/ai/prompts/features/assistant-chat'
import type { PromptContext } from '@/lib/ai/prompts/types'

interface ChatRequestBody {
  message: string
  sessionId?: string
  context?: Partial<PromptContext>
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

    // 检查AI配置
    if (!isAnyAIConfigured()) {
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
    const { message, context } = body

    if (!message || !message.trim()) {
      return NextResponse.json({ error: '消息不能为空' }, { status: 400 })
    }

    console.log('🤖 Processing assistant chat request...')
    console.log(`📝 Message: ${message.substring(0, 100)}...`)

    // 构建上下文字符串
    const contextStr = context
      ? formatContextForChat(context as PromptContext)
      : '无上下文信息'

    // 构建用户提示
    const userPrompt = `## 当前上下文

${contextStr}

## 用户消息

${message}

---

请根据上下文和用户消息，提供有帮助的回复。

如果用户的请求需要执行特定操作，请在actions中提供相应的按钮。
如果你认为有更好的后续问题，请在suggestions中提供。

返回JSON格式（不要用markdown代码块包裹）：
{
  "content": "Markdown格式的回复内容",
  "actions": [
    {
      "type": "navigate|execute|show_modal|confirm",
      "target": "目标URL或操作标识",
      "label": "按钮显示文字"
    }
  ],
  "suggestions": ["建议问题1", "建议问题2"],
  "metadata": {
    "intent": "识别到的意图类型"
  }
}`

    // 调用AI
    const aiClient = createAIClient()
    const model = getBestModel()

    console.log(`📊 Using model: ${model}`)

    const completion = await aiClient.chat.completions.create({
      model,
      messages: [
        {
          role: 'system',
          content: ASSISTANT_CHAT_SYSTEM_PROMPT,
        },
        {
          role: 'user',
          content: userPrompt,
        },
      ],
      temperature: TEMPERATURE_PRESETS.CONVERSATIONAL,
      max_tokens: 2000,
    })

    const responseText = completion.choices[0]?.message?.content || ''
    console.log(`📝 AI response length: ${responseText.length}`)

    // 解析响应
    const parsed = parseAssistantChatOutput(responseText)

    if (!parsed) {
      console.error('❌ Failed to parse AI response')
      return NextResponse.json({
        content: responseText,
        actions: [],
        suggestions: [],
        metadata: {},
      })
    }

    console.log('✅ Successfully processed assistant chat')

    return NextResponse.json({
      content: parsed.content,
      actions: parsed.actions || [],
      suggestions: parsed.suggestions || [],
      metadata: parsed.metadata || {},
    })
  } catch (error) {
    console.error('Error in POST /api/assistant/chat:', error)
    return NextResponse.json(
      { error: '处理请求时出错，请重试' },
      { status: 500 }
    )
  }
}
