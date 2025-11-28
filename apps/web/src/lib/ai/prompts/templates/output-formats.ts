/**
 * AI 输出格式规范
 *
 * 定义不同场景下 AI 输出的格式要求
 */

// ============================================
// JSON 格式指令
// ============================================

/**
 * 严格JSON格式 - 用于需要解析的结构化数据
 */
export const JSON_FORMAT_INSTRUCTION = `## 输出格式要求

请返回严格的JSON格式，满足以下要求：
1. 直接输出JSON，不要用markdown代码块包裹
2. 确保JSON语法正确，可以直接被解析
3. 所有字符串使用双引号
4. 不要添加任何注释或额外说明
5. 如果某个字段无法确定，使用null值`

/**
 * 灵活JSON格式 - 允许包含长文本
 */
export const FLEXIBLE_JSON_INSTRUCTION = `## 输出格式要求

请返回JSON格式的响应：
1. 直接输出JSON，不要用markdown代码块包裹
2. 长文本字段可以包含换行符（使用\\n）
3. 确保所有特殊字符正确转义
4. 保持JSON结构完整性`

// ============================================
// Markdown 格式指令
// ============================================

/**
 * 标准Markdown格式
 */
export const MARKDOWN_FORMAT_INSTRUCTION = `## 输出格式要求

请使用Markdown格式输出，遵循以下规范：
1. 使用适当的标题层级（##, ###）
2. 使用列表组织要点
3. 重要内容使用**加粗**
4. 代码或技术术语使用\`反引号\`
5. 保持段落间的适当间距`

/**
 * 简洁Markdown格式
 */
export const CONCISE_MARKDOWN_INSTRUCTION = `## 输出格式要求

使用简洁的Markdown格式：
- 直接输出内容，不需要大标题
- 使用列表和短段落
- 避免冗长的解释
- 突出关键信息`

// ============================================
// 分隔符格式指令
// ============================================

/**
 * 分隔符格式 - 用于避免JSON转义问题的复杂输出
 */
export const DELIMITER_FORMAT_INSTRUCTION = `## 输出格式要求

使用分隔符格式输出，便于解析：

---SCORE---
<匹配分数，0-100的整数>
---RECOMMENDATION---
<推荐等级：STRONG_MATCH / GOOD_MATCH / MODERATE_MATCH / WEAK_MATCH / NOT_RECOMMENDED>
---SUMMARY---
<一句话总结>
---ANALYSIS---
<详细的Markdown分析内容>
---END---

注意：
1. 严格使用指定的分隔符
2. 每个分隔符独占一行
3. 分析内容可以使用完整的Markdown格式
4. 确保以---END---结尾`

/**
 * 简化分隔符格式 - 用于简单的多字段输出
 */
export const SIMPLE_DELIMITER_INSTRUCTION = `## 输出格式要求

使用分隔符格式输出：

---FIELD1---
内容1
---FIELD2---
内容2
---END---

确保每个分隔符独占一行。`

// ============================================
// 纯文本格式指令
// ============================================

/**
 * 纯文本格式 - 用于自然语言输出
 */
export const TEXT_FORMAT_INSTRUCTION = `## 输出格式要求

直接输出纯文本内容：
- 不需要任何格式标记
- 自然流畅的语言表达
- 适合直接展示给用户阅读`

// ============================================
// 特定场景格式
// ============================================

/**
 * 求职信格式
 */
export const COVER_LETTER_FORMAT = `## 求职信格式要求

请按以下结构输出求职信：

1. **开头问候**：正式但友好的称呼
2. **开篇段落**：说明申请职位和了解渠道，简要表达兴趣
3. **核心段落（1-2段）**：展示与岗位相关的经验和能力
4. **公司契合段落**：说明为什么选择这家公司
5. **结尾段落**：表达期待，提供联系方式
6. **署名**：正式的结束语和姓名

注意：
- 总字数控制在300-500字
- 段落之间空一行
- 语气专业且有个人特色`

/**
 * 简历解析JSON Schema
 */
export const RESUME_PARSE_SCHEMA = `## 输出JSON Schema

{
  "basicInfo": {
    "fullName": "string | null",
    "email": "string | null",
    "phone": "string | null",
    "location": "string | null",
    "linkedIn": "string | null",
    "website": "string | null"
  },
  "professionalSummary": "string | null",
  "workExperience": [
    {
      "company": "string",
      "title": "string",
      "location": "string | null",
      "startDate": "string (YYYY-MM format)",
      "endDate": "string | null (YYYY-MM or 'Present')",
      "description": "string | null",
      "achievements": ["string"]
    }
  ],
  "education": [
    {
      "institution": "string",
      "degree": "string",
      "field": "string | null",
      "graduationDate": "string | null (YYYY-MM format)",
      "gpa": "string | null"
    }
  ],
  "skills": {
    "technical": ["string"],
    "soft": ["string"],
    "languages": ["string"],
    "certifications": ["string"]
  },
  "projects": [
    {
      "name": "string",
      "description": "string",
      "technologies": ["string"],
      "url": "string | null"
    }
  ]
}`

/**
 * 岗位解析JSON Schema
 */
export const JOB_PARSE_SCHEMA = `## 输出JSON Schema

{
  "title": "string",
  "company": "string",
  "location": "string | null",
  "jobType": "full-time | part-time | contract | internship | null",
  "salaryMin": "number | null",
  "salaryMax": "number | null",
  "salaryCurrency": "string | null (e.g., 'CNY', 'USD')",
  "description": "string",
  "requirements": "string | null",
  "benefits": "string | null",
  "requiredSkills": ["string"],
  "preferredSkills": ["string"],
  "experienceYears": "number | null",
  "educationLevel": "string | null"
}`

// ============================================
// 格式解析工具
// ============================================

/**
 * 解析分隔符格式的响应
 */
export function parseDelimiterResponse(response: string): Record<string, string> {
  const result: Record<string, string> = {}
  const pattern = /---(\w+)---\n([\s\S]*?)(?=---\w+---|---END---|$)/g
  let match

  while ((match = pattern.exec(response)) !== null) {
    const [, field, content] = match
    if (field !== 'END') {
      result[field.toLowerCase()] = content.trim()
    }
  }

  return result
}

/**
 * 安全解析JSON响应
 */
export function safeParseJSON<T>(response: string): T | null {
  try {
    return JSON.parse(response) as T
  } catch {}

  try {
    // Clean common AI wrappers (```json ... ```), slice outer braces
    const { cleanJsonResponse } = require('@/lib/json-utils') as typeof import('@/lib/json-utils')
    const cleaned = cleanJsonResponse(response)
    return JSON.parse(cleaned) as T
  } catch {}

  // Legacy regex fallback
  const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[1].trim()) as T
    } catch {}
  }
  return null
}

// ============================================
// 导出
// ============================================

export const OUTPUT_FORMAT_INSTRUCTIONS = {
  JSON: JSON_FORMAT_INSTRUCTION,
  FLEXIBLE_JSON: FLEXIBLE_JSON_INSTRUCTION,
  MARKDOWN: MARKDOWN_FORMAT_INSTRUCTION,
  CONCISE_MARKDOWN: CONCISE_MARKDOWN_INSTRUCTION,
  DELIMITER: DELIMITER_FORMAT_INSTRUCTION,
  SIMPLE_DELIMITER: SIMPLE_DELIMITER_INSTRUCTION,
  TEXT: TEXT_FORMAT_INSTRUCTION,
  COVER_LETTER: COVER_LETTER_FORMAT,
  RESUME_SCHEMA: RESUME_PARSE_SCHEMA,
  JOB_SCHEMA: JOB_PARSE_SCHEMA,
} as const

export type OutputFormatKey = keyof typeof OUTPUT_FORMAT_INSTRUCTIONS
