/**
 * AI助手对话 Prompt
 *
 * 用于全局AI助手侧栏的对话交互
 */

import type { PromptTemplate, IntentType, AgentAction, PromptContext } from '../types'
import { PERSONAS } from '../templates/system-personas'
import { LANGUAGE_HINTS, ERROR_HANDLING } from '../templates/common-sections'

// ============================================
// 助手对话 System Prompt
// ============================================

export const ASSISTANT_CHAT_SYSTEM_PROMPT = `${PERSONAS.GENERAL_ASSISTANT}

${LANGUAGE_HINTS.CHINESE}

${ERROR_HANDLING.GENERAL}

## 你的能力范围

你可以帮助用户完成以下任务：

### 岗位相关
- 分析岗位与简历的匹配度
- 解析和导入岗位信息（从URL或文本）
- 提供岗位申请建议

### 简历相关
- 优化简历内容
- 生成针对性求职信
- 评估简历质量

### 求职咨询
- 回答求职相关问题
- 提供面试准备建议
- 职业发展规划

## 上下文感知

你会收到用户当前所在页面的上下文信息。根据上下文，你应该：
- 主动提供相关的操作建议
- 理解用户意图时考虑当前上下文
- 在响应中包含可执行的操作按钮

## 响应格式

你的响应应该是JSON格式，包含：
1. content: Markdown格式的回复内容
2. actions: 建议的操作按钮（可选）
3. suggestions: 后续问题建议（可选）
4. metadata: 元数据（可选）

示例：
{
  "content": "## 分析结果\\n\\n您的简历与这个岗位匹配度较高...",
  "actions": [
    {
      "type": "navigate",
      "target": "/jobs/xxx/analysis",
      "label": "查看详细分析"
    }
  ],
  "suggestions": ["如何优化我的简历？", "这个岗位的面试准备建议"]
}`

// ============================================
// 助手对话 User Prompt 模板
// ============================================

export const ASSISTANT_CHAT_USER_PROMPT = `## 当前上下文

{{context}}

## 用户消息

{{message}}

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
      "label": "按钮显示文字",
      "icon": "图标名称（可选）",
      "params": {},
      "requiresConfirmation": false
    }
  ],
  "suggestions": ["建议问题1", "建议问题2"],
  "metadata": {
    "intent": "识别到的意图类型"
  }
}`

// ============================================
// 助手对话 Prompt 模板定义
// ============================================

export const ASSISTANT_CHAT_TEMPLATE: PromptTemplate = {
  id: 'assistant-chat',
  name: 'AI助手对话',
  description: '全局AI助手侧栏的对话交互',
  version: '1.0.0',
  systemPrompt: ASSISTANT_CHAT_SYSTEM_PROMPT,
  userPromptTemplate: ASSISTANT_CHAT_USER_PROMPT,
  temperature: 0.7,
  maxTokens: 2000,
  outputFormat: 'json',
  variables: [
    { name: 'context', description: '当前上下文信息', required: true, type: 'string' },
    { name: 'message', description: '用户消息', required: true, type: 'string' },
  ],
}

// ============================================
// 助手对话输出Schema
// ============================================

export interface AssistantChatOutput {
  content: string
  actions?: AgentAction[]
  suggestions?: string[]
  metadata?: {
    intent?: IntentType
    [key: string]: unknown
  }
}

// ============================================
// 上下文格式化辅助函数
// ============================================

export function formatContextForChat(context: PromptContext): string {
  const lines: string[] = []

  // 页面信息
  lines.push(`### 当前页面`)
  lines.push(`- 路径: ${context.currentPage.path}`)
  lines.push(`- 类型: ${context.currentPage.type}`)
  if (context.currentPage.params) {
    lines.push(`- 参数: ${JSON.stringify(context.currentPage.params)}`)
  }

  // 用户信息
  if (context.user) {
    lines.push('')
    lines.push(`### 用户`)
    lines.push(`- 姓名: ${context.user.name || '未设置'}`)
    lines.push(`- 邮箱: ${context.user.email || '未设置'}`)
  }

  // Profile信息
  if (context.profile) {
    lines.push('')
    lines.push(`### 用户档案`)
    lines.push(`- 姓名: ${context.profile.fullName}`)
    if (context.profile.professionalSummary) {
      lines.push(`- 职业摘要: ${context.profile.professionalSummary.substring(0, 100)}...`)
    }
    lines.push(`- 有工作经历: ${context.profile.hasWorkExperience ? '是' : '否'}`)
    lines.push(`- 有教育背景: ${context.profile.hasEducation ? '是' : '否'}`)
    lines.push(`- 有技能: ${context.profile.hasSkills ? '是' : '否'}`)
  }

  // 当前岗位
  if (context.activeJob) {
    lines.push('')
    lines.push(`### 当前岗位`)
    lines.push(`- 标题: ${context.activeJob.title}`)
    lines.push(`- 公司: ${context.activeJob.company}`)
    if (context.activeJob.location) {
      lines.push(`- 地点: ${context.activeJob.location}`)
    }
    if (context.activeJob.description) {
      lines.push(`- 描述: ${context.activeJob.description.substring(0, 200)}...`)
    }
  }

  // 当前简历
  if (context.activeResume) {
    lines.push('')
    lines.push(`### 当前简历`)
    lines.push(`- 标题: ${context.activeResume.title}`)
    lines.push(`- 有内容: ${context.activeResume.hasContent ? '是' : '否'}`)
  }

  // 分析会话
  if (context.activeSession) {
    lines.push('')
    lines.push(`### 分析会话`)
    if (context.activeSession.score !== undefined) {
      lines.push(`- 匹配分数: ${context.activeSession.score}`)
    }
    if (context.activeSession.recommendation) {
      lines.push(`- 推荐等级: ${context.activeSession.recommendation}`)
    }
    lines.push(`- 已有分析: ${context.activeSession.hasAnalysis ? '是' : '否'}`)
  }

  return lines.join('\n')
}

// ============================================
// 构建助手对话Prompt
// ============================================

export function buildAssistantChatPrompt(context: PromptContext, message: string): string {
  const contextStr = formatContextForChat(context)
  return ASSISTANT_CHAT_USER_PROMPT
    .replace('{{context}}', contextStr)
    .replace('{{message}}', message)
}

// ============================================
// 解析助手对话输出
// ============================================

export function parseAssistantChatOutput(responseText: string): AssistantChatOutput | null {
  try {
    // 尝试直接解析JSON
    let jsonStr = responseText
    const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
    if (jsonMatch) {
      jsonStr = jsonMatch[1]
    }

    const parsed = JSON.parse(jsonStr.trim()) as AssistantChatOutput
    return {
      content: parsed.content || '',
      actions: parsed.actions,
      suggestions: parsed.suggestions,
      metadata: parsed.metadata,
    }
  } catch {
    // 尝试提取JSON
    try {
      const match = responseText.match(/\{[\s\S]*\}/)
      if (match) {
        const parsed = JSON.parse(match[0]) as AssistantChatOutput
        return {
          content: parsed.content || '',
          actions: parsed.actions,
          suggestions: parsed.suggestions,
          metadata: parsed.metadata,
        }
      }
    } catch {
      // 如果还是失败，返回原始文本作为内容
    }

    return {
      content: responseText,
      actions: undefined,
      suggestions: undefined,
      metadata: undefined,
    }
  }
}

// ============================================
// 页面类型对应的默认操作
// ============================================

export const PAGE_TYPE_ACTIONS: Record<string, AgentAction[]> = {
  'job-detail': [
    {
      type: 'navigate',
      target: '/jobs/{{jobId}}/analysis',
      label: '匹配分析',
      icon: 'Sparkles',
    },
    {
      type: 'navigate',
      target: '/jobs/{{jobId}}/cover-letter',
      label: '生成求职信',
      icon: 'FileText',
    },
  ],
  'job-analysis': [
    {
      type: 'execute',
      target: 'optimize-resume',
      label: 'AI优化简历',
      icon: 'Wand2',
    },
    {
      type: 'show_modal',
      target: 'interview-prep',
      label: '面试准备',
      icon: 'MessageSquare',
    },
  ],
  'resume-detail': [
    {
      type: 'execute',
      target: 'improve-resume',
      label: '优化简历',
      icon: 'Sparkles',
    },
    {
      type: 'execute',
      target: 'export-pdf',
      label: '导出PDF',
      icon: 'Download',
    },
  ],
  'jobs': [
    {
      type: 'navigate',
      target: '/jobs/import',
      label: '导入岗位',
      icon: 'Plus',
    },
  ],
}

// ============================================
// 获取页面类型对应的默认操作
// ============================================

export function getDefaultActionsForPage(
  pageType: string,
  params?: Record<string, string>
): AgentAction[] {
  const actions = PAGE_TYPE_ACTIONS[pageType] || []

  // 替换动态参数
  return actions.map((action) => ({
    ...action,
    target: params
      ? Object.entries(params).reduce(
          (target, [key, value]) => target.replace(`{{${key}}}`, value),
          action.target
        )
      : action.target,
  }))
}
