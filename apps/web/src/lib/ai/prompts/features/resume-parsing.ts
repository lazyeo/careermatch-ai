/**
 * 简历解析 Prompt
 *
 * 用于从PDF/Word/Text文件中提取简历信息
 */

import type { PromptTemplate } from '../types'
import { PERSONAS } from '../templates/system-personas'
import { OUTPUT_FORMAT_INSTRUCTIONS } from '../templates/output-formats'
import { LANGUAGE_HINTS, ERROR_HANDLING } from '../templates/common-sections'

// ============================================
// 简历解析 System Prompt
// ============================================

export const RESUME_PARSING_SYSTEM_PROMPT = `${PERSONAS.INFORMATION_EXTRACTOR}

${LANGUAGE_HINTS.BILINGUAL}

${ERROR_HANDLING.INSUFFICIENT_INFO}`

// ============================================
// 简历解析 User Prompt 模板
// ============================================

export const RESUME_PARSING_USER_PROMPT = `你是专业的简历解析专家和职业顾问。你的任务是从简历中**主动挖掘**所有有价值的信息。

## 核心原则
1. **主动挖掘**：不要被动等待信息出现，要主动识别简历中的每一个有价值的细节
2. **信息完整性**：即使是隐含的、不明显的信息也要尝试提取
3. **灵活扩展**：对于标准字段之外的信息，使用 extended_data 字段保存

## 提取指令
1. **基本信息**：姓名、联系方式、社交链接、所在地等
2. **职业经历**：完整提取每份工作的公司、职位、时间、职责、成就、使用的技术
3. **教育背景**：学校、学位、专业、时间、GPA、荣誉奖项
4. **技能清单**：主动识别技术技能、软技能、语言能力、工具熟练度
5. **项目经历**：项目名称、描述、角色、技术栈、成果亮点
6. **证书资质**：证书名称、颁发机构、有效期
7. **其他有价值信息**：
   - 志愿者经历、社区贡献
   - 发表的文章、演讲、专利
   - 兴趣爱好（如果与求职相关）
   - 推荐人信息
   - 期望薪资、工作偏好
   - 任何其他独特的、有价值的信息

## 格式化规则
- 日期格式化为 YYYY-MM-DD（仅有年份时用 YYYY-01-01）
- "至今"/"Present"/"Current" → is_current=true, end_date=null
- 技能分类：编程语言、框架、工具、软技能、语言等
- 保留原始措辞，尤其是成就描述

## 简历内容：
{{content}}

${OUTPUT_FORMAT_INSTRUCTIONS.RESUME_SCHEMA}

注意：
1. extended_data 中的字段是可选的，只有在简历中存在相关信息时才需要填写
2. 如果某个字段找不到信息，使用空字符串、空数组或null
3. 不要返回markdown代码块，直接返回JSON`

// ============================================
// 简历解析 Prompt 模板定义
// ============================================

export const RESUME_PARSING_TEMPLATE: PromptTemplate = {
  id: 'resume-parsing',
  name: '简历解析',
  description: '从简历文件中提取结构化信息',
  version: '1.0.0',
  systemPrompt: RESUME_PARSING_SYSTEM_PROMPT,
  userPromptTemplate: RESUME_PARSING_USER_PROMPT,
  temperature: 0.1, // 低温度确保稳定输出
  maxTokens: 8000,
  outputFormat: 'json',
  variables: [
    {
      name: 'content',
      description: '简历文本内容',
      required: true,
      type: 'string',
    },
  ],
}

// ============================================
// 简历解析输出Schema
// ============================================

export interface ParsedResumeOutput {
  personal_info: {
    full_name: string
    email: string
    phone?: string
    location?: string
    linkedin_url?: string
    github_url?: string
    website_url?: string
    professional_summary?: string
  }
  work_experiences: Array<{
    company: string
    position: string
    location?: string
    start_date: string
    end_date?: string
    is_current: boolean
    description?: string
    achievements?: string[]
    technologies?: string[]
  }>
  education: Array<{
    institution: string
    degree: string
    major: string
    location?: string
    start_date: string
    end_date?: string
    is_current: boolean
    gpa?: number
    achievements?: string[]
  }>
  skills: Array<{
    name: string
    level?: 'beginner' | 'intermediate' | 'advanced' | 'expert'
    category?: string
  }>
  projects: Array<{
    name: string
    description: string
    role?: string
    start_date?: string
    end_date?: string
    technologies?: string[]
    highlights?: string[]
    url?: string
    github_url?: string
  }>
  certifications: Array<{
    name: string
    issuer: string
    issue_date: string
    expiry_date?: string
    credential_id?: string
    credential_url?: string
  }>
  extended_data?: {
    volunteer_experience?: Array<{
      organization: string
      role: string
      period?: string
      description?: string
    }>
    publications?: Array<{
      title: string
      type: string
      date?: string
      url?: string
    }>
    languages?: Array<{
      language: string
      proficiency: string
    }>
    references?: Array<{
      name: string
      relationship: string
      contact?: string
    }>
    preferences?: {
      expected_salary?: string
      preferred_locations?: string[]
      job_types?: string[]
      availability?: string
    }
    additional_sections?: Array<{
      title: string
      content: string
    }>
  }
}

// ============================================
// 构建简历解析Prompt的辅助函数
// ============================================

export function buildResumeParsingPrompt(content: string): string {
  return RESUME_PARSING_USER_PROMPT.replace('{{content}}', content)
}
