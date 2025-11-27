/**
 * Feature Prompts 导出
 */

// 简历解析
export * from './resume-parsing'

// 岗位解析
export * from './job-parsing'

// 岗位匹配分析
export * from './job-matching'

// 求职信生成
export * from './cover-letter'

// 助手对话
export * from './assistant-chat'

// ============================================
// Prompt 模板注册表
// ============================================

import { RESUME_PARSING_TEMPLATE } from './resume-parsing'
import { JOB_PARSING_TEMPLATE } from './job-parsing'
import { JOB_MATCHING_TEMPLATE } from './job-matching'
import { COVER_LETTER_TEMPLATE } from './cover-letter'
import { ASSISTANT_CHAT_TEMPLATE } from './assistant-chat'
import type { PromptTemplate } from '../types'

/**
 * 所有 Prompt 模板的注册表
 */
export const PROMPT_TEMPLATES: Record<string, PromptTemplate> = {
  'resume-parsing': RESUME_PARSING_TEMPLATE,
  'job-parsing': JOB_PARSING_TEMPLATE,
  'job-matching': JOB_MATCHING_TEMPLATE,
  'cover-letter': COVER_LETTER_TEMPLATE,
  'assistant-chat': ASSISTANT_CHAT_TEMPLATE,
}

/**
 * 获取 Prompt 模板
 */
export function getPromptTemplate(id: string): PromptTemplate | undefined {
  return PROMPT_TEMPLATES[id]
}

/**
 * 获取所有 Prompt 模板
 */
export function getAllPromptTemplates(): PromptTemplate[] {
  return Object.values(PROMPT_TEMPLATES)
}
