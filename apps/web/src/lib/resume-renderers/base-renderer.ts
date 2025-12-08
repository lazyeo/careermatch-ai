/**
 * Base Resume Renderer
 * 简历渲染器抽象基类
 */

import type {
  ResumeTemplate,
  TemplateConfig,
  OutputFormat,
} from '@careermatch/shared'
import type { ResumeContent } from '@careermatch/shared'

/**
 * 渲染结果类型
 */
export type RenderResult<T> = {
  success: boolean
  data?: T
  error?: string
}

/**
 * 抽象基类：简历渲染器
 * 所有渲染器必须继承此类并实现render方法
 */
export abstract class BaseResumeRenderer<TOutput> {
  protected template: ResumeTemplate
  protected config: TemplateConfig

  constructor(template: ResumeTemplate) {
    this.template = template
    this.config = template.config
  }

  /**
   * 抽象方法：渲染简历
   * 子类必须实现此方法
   */
  abstract render(content: ResumeContent): Promise<TOutput>

  /**
   * 获取输出格式
   */
  abstract getFormat(): OutputFormat

  /**
   * 验证模板是否支持当前格式
   */
  protected validateTemplateSupport(): void {
    const format = this.getFormat()

    if (format === 'pdf' && !this.template.supportsPdf) {
      throw new Error(
        `Template "${this.template.name}" does not support PDF output`
      )
    }

    if (format === 'html' && !this.template.supportsHtml) {
      throw new Error(
        `Template "${this.template.name}" does not support HTML output`
      )
    }
  }

  /**
   * 格式化日期范围
   */
  protected formatDateRange(
    startDate: string,
    endDate?: string | null
  ): string {
    const start = this.formatDate(startDate)
    const end = endDate ? this.formatDate(endDate) : 'Present'
    return `${start} - ${end}`
  }

  /**
   * 格式化单个日期
   */
  protected formatDate(date: string | Date): string {
    const d = new Date(date)
    const year = d.getFullYear()
    const month = d.toLocaleString('en', { month: 'short' })
    return `${month} ${year}`
  }

  /**
   * 获取章节标题（支持i18n）
   */
  protected getSectionTitle(sectionType: string): string {
    const titles: Record<string, string> = {
      header: 'Personal Information',
      summary: 'Professional Summary',
      skills: 'Skills',
      experience: 'Work Experience',
      projects: 'Projects',
      education: 'Education',
      certifications: 'Certifications',
      interests: 'Interests',
    }
    return titles[sectionType] || sectionType
  }
}

/**
 * 渲染器工厂函数类型
 */
export type RendererFactory<T> = (template: ResumeTemplate) => BaseResumeRenderer<T>
