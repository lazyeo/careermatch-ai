/**
 * AI Prompt 统一管理系统
 *
 * 提供类型安全的 Prompt 模板系统
 */

// 类型定义
export * from './types'

// 模板
export * from './templates'

// 功能 Prompts
export * from './features'

// 注意：builders中的构建函数与features中的同名函数有冲突
// 需要从builders直接导入: import { ... } from '@/lib/ai/prompts/builders'
