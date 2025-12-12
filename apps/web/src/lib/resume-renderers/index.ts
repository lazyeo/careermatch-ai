/**
 * Resume Renderers - Unified Export
 * 简历渲染器统一导出
 */

import type { ResumeTemplate, OutputFormat } from '@careermatch/shared'
import { BaseResumeRenderer } from './base-renderer'
import { PDFRenderer } from './pdf-renderer'
import { HTMLRenderer } from './html-renderer'
import { DOCXRenderer } from './docx-renderer'

// 导出所有渲染器类
export { BaseResumeRenderer } from './base-renderer'
export { PDFRenderer } from './pdf-renderer'
export { HTMLRenderer } from './html-renderer'
export { DOCXRenderer } from './docx-renderer'

/**
 * 渲染器工厂函数
 * 根据输出格式获取对应的渲染器实例
 */
export function getResumeRenderer(
  format: OutputFormat,
  template: ResumeTemplate
): BaseResumeRenderer<Buffer | string> {
  switch (format) {
    case 'pdf':
      return new PDFRenderer(template)
    case 'html':
      return new HTMLRenderer(template)
    case 'docx':
      return new DOCXRenderer(template)
    default:
      throw new Error(`Unsupported output format: ${format}`)
  }
}

/**
 * 类型：渲染器映射
 */
export type RendererMap = {
  pdf: PDFRenderer
  html: HTMLRenderer
  docx: DOCXRenderer
}
