/**
 * 岗位解析 Prompt
 *
 * 用于从URL或文本中提取岗位信息
 */

import type { PromptTemplate } from '../types'
import { PERSONAS } from '../templates/system-personas'
import { OUTPUT_FORMAT_INSTRUCTIONS } from '../templates/output-formats'
import { LANGUAGE_HINTS } from '../templates/common-sections'

// ============================================
// 岗位解析 System Prompt
// ============================================

export const JOB_PARSING_SYSTEM_PROMPT = `${PERSONAS.INFORMATION_EXTRACTOR}

${LANGUAGE_HINTS.BILINGUAL}

你专门负责从招聘信息中准确提取结构化数据。`

// ============================================
// 岗位解析 User Prompt 模板
// ============================================

export const JOB_PARSING_USER_PROMPT = `你是专业的招聘信息解析专家。你的任务是从招聘信息中**主动挖掘**所有有价值的信息。

## 核心原则
1. **准确提取**：精确识别岗位的核心信息
2. **结构化输出**：将非结构化的招聘文本转换为结构化数据
3. **智能推断**：对于隐含信息，基于上下文进行合理推断

## 提取指令
1. **基本信息**：岗位标题、公司名称、工作地点
2. **岗位类型**：全职/兼职/合同/实习/临时
3. **薪资信息**：薪资范围、货币类型（智能识别NZD/AUD/USD/CNY等）
4. **岗位描述**：工作职责、日常任务
5. **岗位要求**：技能要求、经验要求、学历要求
6. **福利待遇**：公司福利、额外benefits
7. **时间信息**：发布日期、申请截止日期
8. **技能清单**：提取所需的具体技能列表
9. **公司信息**：公司简介（如有提供）

## 格式化规则
- 日期格式化为 YYYY-MM-DD
- 薪资转换为数字（去除货币符号和逗号）
- 岗位类型映射：full-time/part-time/contract/internship/casual
- 如果薪资是按小时/周/月计算，尝试换算为年薪

## 招聘信息内容：
{{content}}

${OUTPUT_FORMAT_INSTRUCTIONS.JOB_SCHEMA}

注意：
1. 如果某个字段找不到信息，使用null或省略该字段
2. 不要返回markdown代码块，直接返回JSON
3. 薪资字段必须是数字，不是字符串`

// ============================================
// 岗位解析 Prompt 模板定义
// ============================================

export const JOB_PARSING_TEMPLATE: PromptTemplate = {
  id: 'job-parsing',
  name: '岗位解析',
  description: '从招聘信息中提取结构化数据',
  version: '1.0.0',
  systemPrompt: JOB_PARSING_SYSTEM_PROMPT,
  userPromptTemplate: JOB_PARSING_USER_PROMPT,
  temperature: 0.1,
  maxTokens: 4000,
  outputFormat: 'json',
  variables: [
    {
      name: 'content',
      description: '招聘信息文本内容',
      required: true,
      type: 'string',
    },
  ],
}

// ============================================
// 岗位解析输出Schema
// ============================================

export interface ParsedJobOutput {
  title: string
  company: string
  location?: string
  job_type?: 'full-time' | 'part-time' | 'contract' | 'internship' | 'casual'
  salary_min?: number
  salary_max?: number
  salary_currency?: string
  description?: string
  requirements?: string
  benefits?: string
  posted_date?: string
  deadline?: string
  skills_required?: string[]
  experience_years?: string
  education_requirement?: string
  company_info?: string
  application_url?: string
}

// ============================================
// 构建岗位解析Prompt的辅助函数
// ============================================

export function buildJobParsingPrompt(content: string): string {
  return JOB_PARSING_USER_PROMPT.replace('{{content}}', content)
}
