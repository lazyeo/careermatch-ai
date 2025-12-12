/**
 * DOCX Resume Renderer
 * 使用 docx 库生成可编辑的 Word 文档
 */

import {
  Document,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  Table,
  TableRow,
  TableCell,
  WidthType,
  Packer,
  SectionType,
  PageOrientation,
  convertInchesToTwip,
} from 'docx'
import type {
  ResumeTemplate,
  TemplateConfig,
  OutputFormat,
  ResumeContent,
} from '@careermatch/shared'
import { BaseResumeRenderer } from './base-renderer'

/**
 * DOCX渲染器
 */
export class DOCXRenderer extends BaseResumeRenderer<Buffer> {
  constructor(template: ResumeTemplate) {
    super(template)
  }

  getFormat(): OutputFormat {
    return 'docx'
  }

  /**
   * 渲染简历为DOCX Buffer
   */
  async render(content: ResumeContent): Promise<Buffer> {
    const { colors, fonts } = this.config

    // 创建文档
    const doc = new Document({
      styles: {
        paragraphStyles: [
          {
            id: 'Normal',
            name: 'Normal',
            run: {
              font: this.mapFontToDocx(fonts.body),
              size: fonts.bodySize * 2, // docx uses half-points
            },
          },
          {
            id: 'Heading1',
            name: 'Heading 1',
            basedOn: 'Normal',
            next: 'Normal',
            run: {
              font: this.mapFontToDocx(fonts.heading),
              size: (fonts.headingSize + 8) * 2,
              bold: true,
              color: colors.text.replace('#', ''),
            },
          },
          {
            id: 'Heading2',
            name: 'Heading 2',
            basedOn: 'Normal',
            next: 'Normal',
            run: {
              font: this.mapFontToDocx(fonts.heading),
              size: (fonts.headingSize + 2) * 2,
              bold: true,
              color: colors.primary.replace('#', ''),
            },
            paragraph: {
              spacing: { before: 240, after: 120 },
              border: {
                bottom: {
                  color: colors.accent.replace('#', ''),
                  space: 1,
                  size: 6,
                  style: BorderStyle.SINGLE,
                },
              },
            },
          },
          {
            id: 'Heading3',
            name: 'Heading 3',
            basedOn: 'Normal',
            next: 'Normal',
            run: {
              font: this.mapFontToDocx(fonts.heading),
              size: (fonts.bodySize + 2) * 2,
              bold: true,
            },
          },
        ],
      },
      sections: [
        {
          properties: {
            type: SectionType.CONTINUOUS,
            page: {
              margin: {
                top: convertInchesToTwip(0.75),
                bottom: convertInchesToTwip(0.75),
                left: convertInchesToTwip(0.75),
                right: convertInchesToTwip(0.75),
              },
              size: {
                orientation: PageOrientation.PORTRAIT,
              },
            },
          },
          children: this.buildDocumentContent(content, colors),
        },
      ],
    })

    // 打包为 Buffer
    const buffer = await Packer.toBuffer(doc)
    return Buffer.from(buffer)
  }

  /**
   * 构建文档内容
   */
  private buildDocumentContent(
    content: ResumeContent,
    colors: TemplateConfig['colors']
  ): (Paragraph | Table)[] {
    const elements: (Paragraph | Table)[] = []

    // 1. 个人信息头部
    if (content.personalInfo) {
      elements.push(
        new Paragraph({
          text: content.personalInfo.fullName || 'Your Name',
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
          spacing: { after: 120 },
        })
      )

      // 联系信息行
      const contactParts: string[] = []
      if (content.personalInfo.email) contactParts.push(content.personalInfo.email)
      if (content.personalInfo.phone) contactParts.push(content.personalInfo.phone)
      if (content.personalInfo.location) contactParts.push(content.personalInfo.location)
      if (content.personalInfo.linkedIn) contactParts.push(content.personalInfo.linkedIn)
      if (content.personalInfo.github) contactParts.push(content.personalInfo.github)

      if (contactParts.length > 0) {
        elements.push(
          new Paragraph({
            children: [
              new TextRun({
                text: contactParts.join('  |  '),
                size: 20,
                color: colors.textLight.replace('#', ''),
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 240 },
          })
        )
      }

      // 分隔线
      elements.push(
        new Paragraph({
          border: {
            bottom: {
              color: colors.primary.replace('#', ''),
              space: 1,
              size: 12,
              style: BorderStyle.SINGLE,
            },
          },
          spacing: { after: 240 },
        })
      )
    }

    // 2. 职业目标/摘要
    if (content.careerObjective) {
      elements.push(
        new Paragraph({
          text: 'Professional Summary',
          heading: HeadingLevel.HEADING_2,
        })
      )
      elements.push(
        new Paragraph({
          text: content.careerObjective,
          spacing: { after: 240 },
        })
      )
    }

    // 3. 技能
    if (content.skills && content.skills.length > 0) {
      elements.push(
        new Paragraph({
          text: 'Skills',
          heading: HeadingLevel.HEADING_2,
        })
      )

      // 按类别分组技能
      const skillsByCategory: Record<string, string[]> = {}
      content.skills.forEach((skill) => {
        const category = skill.category || 'General'
        if (!skillsByCategory[category]) {
          skillsByCategory[category] = []
        }
        skillsByCategory[category].push(skill.name)
      })

      Object.entries(skillsByCategory).forEach(([category, skills]) => {
        elements.push(
          new Paragraph({
            children: [
              new TextRun({ text: `${category}: `, bold: true }),
              new TextRun({ text: skills.join(', ') }),
            ],
            spacing: { after: 120 },
          })
        )
      })

      elements.push(new Paragraph({ spacing: { after: 120 } }))
    }

    // 4. 工作经历
    if (content.workExperience && content.workExperience.length > 0) {
      elements.push(
        new Paragraph({
          text: 'Work Experience',
          heading: HeadingLevel.HEADING_2,
        })
      )

      content.workExperience.forEach((exp) => {
        // 职位和日期
        elements.push(
          new Paragraph({
            children: [
              new TextRun({ text: exp.position, bold: true, size: 24 }),
              new TextRun({
                text: `  |  ${this.formatDateRange(exp.startDate, exp.endDate)}`,
                size: 20,
                color: colors.textLight.replace('#', ''),
              }),
            ],
            spacing: { before: 120 },
          })
        )

        // 公司
        elements.push(
          new Paragraph({
            children: [
              new TextRun({
                text: exp.company,
                italics: true,
                color: colors.textLight.replace('#', ''),
              }),
            ],
            spacing: { after: 60 },
          })
        )

        // 描述
        if (exp.description) {
          elements.push(
            new Paragraph({
              text: exp.description,
              spacing: { after: 60 },
            })
          )
        }

        // 成就列表
        if (exp.achievements && exp.achievements.length > 0) {
          exp.achievements.forEach((achievement) => {
            elements.push(
              new Paragraph({
                text: achievement,
                bullet: { level: 0 },
                spacing: { after: 40 },
              })
            )
          })
        }

        elements.push(new Paragraph({ spacing: { after: 120 } }))
      })
    }

    // 5. 项目
    if (content.projects && content.projects.length > 0) {
      elements.push(
        new Paragraph({
          text: 'Projects',
          heading: HeadingLevel.HEADING_2,
        })
      )

      content.projects.forEach((project) => {
        // 项目名称
        elements.push(
          new Paragraph({
            children: [
              new TextRun({ text: project.name, bold: true, size: 24 }),
            ],
            spacing: { before: 120 },
          })
        )

        // 描述
        if (project.description) {
          elements.push(
            new Paragraph({
              text: project.description,
              spacing: { after: 60 },
            })
          )
        }

        // 技术栈
        if (project.technologies && project.technologies.length > 0) {
          elements.push(
            new Paragraph({
              children: [
                new TextRun({ text: 'Technologies: ', bold: true, size: 20 }),
                new TextRun({
                  text: project.technologies.join(', '),
                  size: 20,
                  color: colors.primary.replace('#', ''),
                }),
              ],
              spacing: { after: 60 },
            })
          )
        }

        // 亮点
        if (project.highlights && project.highlights.length > 0) {
          project.highlights.forEach((highlight) => {
            elements.push(
              new Paragraph({
                text: highlight,
                bullet: { level: 0 },
                spacing: { after: 40 },
              })
            )
          })
        }

        elements.push(new Paragraph({ spacing: { after: 120 } }))
      })
    }

    // 6. 教育背景
    if (content.education && content.education.length > 0) {
      elements.push(
        new Paragraph({
          text: 'Education',
          heading: HeadingLevel.HEADING_2,
        })
      )

      content.education.forEach((edu) => {
        // 学位和专业
        elements.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `${edu.degree}${edu.major ? ` in ${edu.major}` : ''}`,
                bold: true,
                size: 24,
              }),
              new TextRun({
                text: edu.endDate ? `  |  ${this.formatDate(edu.endDate)}` : '',
                size: 20,
                color: colors.textLight.replace('#', ''),
              }),
            ],
            spacing: { before: 120 },
          })
        )

        // 学校
        elements.push(
          new Paragraph({
            children: [
              new TextRun({
                text: edu.institution,
                italics: true,
                color: colors.textLight.replace('#', ''),
              }),
              edu.gpa
                ? new TextRun({
                    text: `  |  GPA: ${edu.gpa}`,
                    size: 20,
                  })
                : new TextRun({ text: '' }),
            ],
            spacing: { after: 120 },
          })
        )
      })
    }

    // 7. 证书
    if (content.certifications && content.certifications.length > 0) {
      elements.push(
        new Paragraph({
          text: 'Certifications',
          heading: HeadingLevel.HEADING_2,
        })
      )

      content.certifications.forEach((cert) => {
        elements.push(
          new Paragraph({
            children: [
              new TextRun({ text: cert.name, bold: true }),
              cert.issuer
                ? new TextRun({
                    text: ` - ${cert.issuer}`,
                    color: colors.textLight.replace('#', ''),
                  })
                : new TextRun({ text: '' }),
              cert.issueDate
                ? new TextRun({
                    text: `  (${this.formatDate(cert.issueDate)})`,
                    size: 20,
                    color: colors.textLight.replace('#', ''),
                  })
                : new TextRun({ text: '' }),
            ],
            spacing: { after: 80 },
          })
        )
      })
    }

    return elements
  }

  /**
   * 映射字体名称到 DOCX 支持的字体
   */
  private mapFontToDocx(fontName: string): string {
    if (fontName.includes('Times')) return 'Times New Roman'
    if (fontName.includes('Courier')) return 'Courier New'
    if (fontName.includes('Helvetica')) return 'Arial'
    return 'Calibri' // 默认字体
  }
}
