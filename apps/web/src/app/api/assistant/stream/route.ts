/**
 * AI 助手流式聊天 API
 *
 * POST /api/assistant/stream
 *
 * 支持SSE流式响应
 */

import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import {
  createAIClient,
  isAnyAIConfigured,
  getBestModel,
  getDefaultProvider
} from '@/lib/ai-providers'
import {
  ASSISTANT_CHAT_SYSTEM_PROMPT,
  formatContextForChat,
} from '@/lib/ai/prompts/features/assistant-chat'
import type { PromptContext } from '@/lib/ai/prompts/types'

interface StreamRequestBody {
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
      return new Response(JSON.stringify({ error: '请先登录' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // 检查AI配置
    if (!isAnyAIConfigured()) {
      return new Response(
        JSON.stringify({
          error: 'AI服务未配置',
          hint: '请在环境变量中配置AI API密钥',
        }),
        {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    // 解析请求
    const body = (await request.json()) as StreamRequestBody
    const { message, context } = body

    if (!message || !message.trim()) {
      return new Response(JSON.stringify({ error: '消息不能为空' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    console.log('🤖 Processing assistant stream request...')
    console.log(`📝 Message: ${message.substring(0, 100)}...`)
    console.log(`📦 Context received:`, JSON.stringify(context, null, 2))

    // 构建上下文字符串
    const contextStr = context
      ? formatContextForChat(context as PromptContext)
      : '无上下文信息'

    console.log(`📋 Formatted context: ${contextStr.substring(0, 500)}...`)

    // 构建用户提示
    const userPrompt = `## 当前上下文

${contextStr}

## 用户消息

${message}

---

请根据上下文和用户消息，提供有帮助的回复。

使用Markdown格式输出，可以使用标题、列表、代码块等。

在回复的最后，如果有合适的后续问题建议，请用以下格式添加：

---SUGGESTIONS---
- 建议问题1
- 建议问题2
---END---`

    // 创建 AI 客户端和流式请求
    const provider = getDefaultProvider()?.type || 'gemini'
    const aiClient = createAIClient(provider)
    const model = getBestModel(provider)

    console.log(`📊 Using model: ${model}`)

    const stream = await aiClient.chat.completions.create({
      model,
      max_tokens: 2000,
      messages: [
        { role: 'system', content: ASSISTANT_CHAT_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      stream: true,
    })

    // 创建SSE响应
    const encoder = new TextEncoder()

    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          let fullContent = ''

          for await (const event of stream) {
            const delta = event.choices?.[0]?.delta?.content || ''
            if (delta) {
              fullContent += delta

              // 发送SSE事件
              const sseData = JSON.stringify({
                type: 'content',
                data: delta,
              })
              controller.enqueue(encoder.encode(`data: ${sseData}\n\n`))
            }
          }

          // 流式传输完成
          // 解析建议（如果有）
          const suggestions = extractSuggestions(fullContent)
          const cleanContent = removeSuggestionsSection(fullContent)

          // 发送完成事件
          const doneData = JSON.stringify({
            type: 'done',
            data: {
              content: cleanContent,
              suggestions,
              metadata: {
                model,
                totalLength: cleanContent.length,
              },
            },
          })
          controller.enqueue(encoder.encode(`data: ${doneData}\n\n`))
          controller.close()
        } catch (error) {
          console.error('Stream error:', error)

          // 发送错误事件
          const errorData = JSON.stringify({
            type: 'error',
            data: {
              message: error instanceof Error ? error.message : '流式响应失败',
            },
          })
          controller.enqueue(encoder.encode(`data: ${errorData}\n\n`))
          controller.close()
        }
      },
    })

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    })
  } catch (error) {
    console.error('Error in POST /api/assistant/stream:', error)
    return new Response(
      JSON.stringify({ error: '处理请求时出错，请重试' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}

/**
 * 提取建议问题
 */
function extractSuggestions(content: string): string[] {
  const suggestionsMatch = content.match(
    /---SUGGESTIONS---\s*([\s\S]*?)\s*---END---/
  )

  if (!suggestionsMatch) return []

  const suggestionsText = suggestionsMatch[1]
  const suggestions = suggestionsText
    .split('\n')
    .map((line) => line.replace(/^-\s*/, '').trim())
    .filter((line) => line.length > 0)

  return suggestions.slice(0, 3) // 最多3个建议
}

/**
 * 移除建议部分，返回干净的内容
 */
function removeSuggestionsSection(content: string): string {
  return content.replace(/---SUGGESTIONS---[\s\S]*?---END---/, '').trim()
}
