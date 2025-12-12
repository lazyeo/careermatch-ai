/**
 * Resume Template System Type Definitions
 * 简历模板系统类型定义
 */

/**
 * 模板颜色配置
 */
export interface TemplateColors {
  primary: string          // 主色调，用于标题和强调
  secondary: string        // 次要色调
  text: string            // 正文文本颜色
  textLight: string       // 浅色文本（如描述、日期）
  background: string      // 背景色
  accent: string          // 强调色（如分隔线、图标）
}

/**
 * 模板字体配置
 */
export interface TemplateFonts {
  heading: string         // 标题字体
  body: string           // 正文字体
  headingSize: number    // 标题字号（pt）
  bodySize: number       // 正文字号（pt）
}

/**
 * 模板间距配置
 */
export interface TemplateSpacing {
  sectionGap: number     // 章节间距（pt）
  itemGap: number        // 条目间距（pt）
  lineHeight: number     // 行高（倍数）
}

/**
 * 简历章节类型
 */
export type ResumeSectionType =
  | 'header'           // 个人信息头部
  | 'summary'          // 职业目标/个人简介
  | 'skills'           // 技能列表
  | 'experience'       // 工作经历
  | 'projects'         // 项目经历
  | 'education'        // 教育背景
  | 'certifications'   // 证书/资质
  | 'interests'        // 兴趣爱好
  | 'portfolio'        // 作品集链接

/**
 * 模板布局类型
 */
export type TemplateLayout =
  | 'single-column'    // 单栏布局
  | 'two-column'       // 双栏布局（35% sidebar + 65% main）

/**
 * 模板配置
 * 存储在数据库的config字段中
 */
export interface TemplateConfig {
  colors: TemplateColors
  fonts: TemplateFonts
  layout: TemplateLayout
  sections_order: ResumeSectionType[]   // 章节显示顺序
  spacing: TemplateSpacing

  // 可选：章节强调权重（用于CV策略）
  default_emphasis?: Record<ResumeSectionType, number>  // 0-100
}

/**
 * 模板分类
 */
export type TemplateCategory =
  | 'modern'      // 现代风格
  | 'classic'     // 经典风格
  | 'creative'    // 创意风格
  | 'industry'    // 行业专用

/**
 * 简历模板
 */
export interface ResumeTemplate {
  id: string                    // 模板ID，如 'modern-blue'
  name: string                  // 显示名称
  description: string | null    // 描述
  category: TemplateCategory    // 分类
  config: TemplateConfig        // 配置
  previewUrl: string | null     // 预览图URL
  supportsPdf: boolean          // 是否支持PDF导出
  supportsHtml: boolean         // 是否支持HTML导出
  isActive: boolean             // 是否启用
  createdAt: Date
  updatedAt: Date
}

/**
 * 用户自定义模板
 */
export interface UserCustomTemplate {
  id: string
  userId: string
  baseTemplateId: string | null  // 基础模板ID
  name: string                   // 用户自定义名称
  customConfig: Partial<TemplateConfig>  // 覆盖的配置
  createdAt: Date
  updatedAt: Date
}

/**
 * 输出格式类型
 */
export type OutputFormat =
  | 'pdf'         // PDF文件
  | 'html'        // HTML网页
  | 'docx'        // Word文档

/**
 * 渲染选项
 */
export interface RenderOptions {
  format: OutputFormat
  template: ResumeTemplate
  customConfig?: Partial<TemplateConfig>  // 临时覆盖配置
}

/**
 * 数据库原始模板类型（从Supabase返回）
 */
export interface DatabaseResumeTemplate {
  id: string
  name: string
  description: string | null
  category: TemplateCategory
  config: TemplateConfig  // JSONB
  preview_url: string | null
  supports_pdf: boolean
  supports_html: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

/**
 * 数据库原始用户模板类型
 */
export interface DatabaseUserCustomTemplate {
  id: string
  user_id: string
  base_template_id: string | null
  name: string
  custom_config: Partial<TemplateConfig>  // JSONB
  created_at: string
  updated_at: string
}

/**
 * 模板转换工具函数类型
 */
export type TemplateTransformer = {
  fromDatabase: (db: DatabaseResumeTemplate) => ResumeTemplate
  toDatabase: (template: Omit<ResumeTemplate, 'createdAt' | 'updatedAt'>) => DatabaseResumeTemplate
}

/**
 * 用户模板转换工具函数类型
 */
export type UserTemplateTransformer = {
  fromDatabase: (db: DatabaseUserCustomTemplate) => UserCustomTemplate
  toDatabase: (template: Omit<UserCustomTemplate, 'createdAt' | 'updatedAt'>) => DatabaseUserCustomTemplate
}
