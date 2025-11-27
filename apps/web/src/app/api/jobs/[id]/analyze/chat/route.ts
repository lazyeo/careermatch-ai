import { createClient } from '@/lib/supabase-server'
import {
  createAIClient,
  isAnyAIConfigured,
  getBestModel,
  TEMPERATURE_PRESETS,
  handleAIError,
  type AIProviderType,
} from '@/lib/ai-providers'
import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/jobs/[id]/analyze/chat
 *
 * 对话式追问 - 基于已有的分析会话继续对话
 * Body: { sessionId: string, message: string }
 * Returns: { messageId, response, suggestedQuestions? }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if any AI provider is configured
    if (!isAnyAIConfigured()) {
      return NextResponse.json(
        { error: 'No AI provider is configured' },
        { status: 503 }
      )
    }

    // Get request body
    const body = await request.json()
    const { sessionId, message } = body as { sessionId: string; message: string }

    if (!sessionId || !message) {
      return NextResponse.json(
        { error: 'sessionId and message are required' },
        { status: 400 }
      )
    }

    // Fetch the session
    const { data: session, error: sessionError } = await supabase
      .from('analysis_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .single()

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    // Fetch the job
    const { data: job } = await supabase
      .from('jobs')
      .select('title, company, description, requirements')
      .eq('id', params.id)
      .single()

    // Fetch the resume
    const { data: resume } = await supabase
      .from('resumes')
      .select('content')
      .eq('id', session.resume_id)
      .single()

    // Fetch existing messages for context
    const { data: existingMessages } = await supabase
      .from('analysis_messages')
      .select('role, content')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })
      .limit(10) // Limit context to last 10 messages

    const conversationHistory = existingMessages || []

    // Get provider from session
    const provider = session.provider as AIProviderType | undefined
    const model = getBestModel(provider)

    console.log(`💬 Chat request using ${provider?.toUpperCase() || 'DEFAULT'} (${model})`)

    // Build chat prompt
    const systemPrompt = buildChatSystemPrompt(job, resume, session)
    const messages = buildChatMessages(systemPrompt, conversationHistory, session.analysis, message)

    // Call AI
    const aiClient = createAIClient(provider)

    const completion = await aiClient.chat.completions.create({
      model,
      messages,
      temperature: TEMPERATURE_PRESETS.BALANCED,
    })

    const response = completion.choices[0].message.content
    if (!response) {
      throw new Error('AI returned empty response')
    }

    console.log('📝 Chat response length:', response.length)

    // Save both messages to database
    const { data: savedMessages, error: saveError } = await supabase
      .from('analysis_messages')
      .insert([
        { session_id: sessionId, role: 'user', content: message },
        { session_id: sessionId, role: 'assistant', content: response },
      ])
      .select()

    if (saveError) {
      console.error('Error saving messages:', saveError)
      // Continue anyway - message display is more important than persistence
    }

    // Generate suggested follow-up questions (optional)
    const suggestedQuestions = generateSuggestedQuestions(message, response)

    return NextResponse.json({
      messageId: savedMessages?.[1]?.id || crypto.randomUUID(),
      response,
      suggestedQuestions,
    })
  } catch (error) {
    console.error('Error in POST /api/jobs/[id]/analyze/chat:', error)

    // Try to extract meaningful error message
    if (error instanceof Error) {
      handleAIError(error)
    }

    return NextResponse.json(
      { error: 'Failed to process chat message' },
      { status: 500 }
    )
  }
}

/**
 * Build system prompt for chat
 */
function buildChatSystemPrompt(
  job: Record<string, unknown> | null,
  resume: Record<string, unknown> | null,
  session: Record<string, unknown>
): string {
  return `你是一位专业的职业顾问，正在帮助求职者分析其简历与目标岗位的匹配情况。

## 上下文信息
- 岗位: ${job?.title || '未知'} @ ${job?.company || '未知'}
- 当前匹配度评分: ${session.score}/100
- 推荐等级: ${session.recommendation}

## 你的职责
1. 根据之前的分析和用户的问题，提供专业、具体的建议
2. 保持对话自然流畅，像真正的职业顾问一样交流
3. 如果用户问题超出你的分析范围，诚实说明
4. 可以主动提出相关的建议或问题
5. 回答要具体、有针对性，避免泛泛而谈

## 格式要求
- 使用Markdown格式回复
- 适当使用列表、粗体等格式增强可读性
- 回复简洁有力，不要过于冗长`
}

/**
 * Build chat messages array
 */
function buildChatMessages(
  systemPrompt: string,
  conversationHistory: Array<{ role: string; content: string }>,
  initialAnalysis: string,
  userMessage: string
): Array<{ role: 'system' | 'user' | 'assistant'; content: string }> {
  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    { role: 'system', content: systemPrompt },
  ]

  // Add initial analysis as first assistant message (context)
  messages.push({
    role: 'assistant',
    content: `以下是我之前的分析报告:\n\n${initialAnalysis}`,
  })

  // Add conversation history
  for (const msg of conversationHistory) {
    messages.push({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    })
  }

  // Add current user message
  messages.push({
    role: 'user',
    content: userMessage,
  })

  return messages
}

/**
 * Generate suggested follow-up questions based on conversation
 */
function generateSuggestedQuestions(userMessage: string, response: string): string[] {
  // Simple keyword-based suggestions
  const suggestions: string[] = []

  const lowerMessage = userMessage.toLowerCase()
  const lowerResponse = response.toLowerCase()

  // Skill-related follow-ups
  if (lowerMessage.includes('技能') || lowerResponse.includes('技能')) {
    suggestions.push('如何在简历中更好地展示这些技能？')
  }

  // Interview-related follow-ups
  if (lowerMessage.includes('面试') || lowerResponse.includes('面试')) {
    suggestions.push('还有哪些面试问题需要准备？')
  }

  // Gap-related follow-ups
  if (lowerMessage.includes('差距') || lowerMessage.includes('不足') || lowerResponse.includes('差距')) {
    suggestions.push('如何弥补这些差距？')
  }

  // Resume optimization
  if (lowerMessage.includes('简历') || lowerResponse.includes('简历')) {
    suggestions.push('简历还有哪些可以优化的地方？')
  }

  // Default suggestions if none matched
  if (suggestions.length === 0) {
    suggestions.push('这个岗位的面试可能会问什么问题？')
    suggestions.push('我的简历还有哪些需要改进的地方？')
  }

  return suggestions.slice(0, 3) // Max 3 suggestions
}
