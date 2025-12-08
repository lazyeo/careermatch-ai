/**
 * HTML Resume Renderer
 * 生成打印优化的HTML简历
 */

import type {
  ResumeTemplate,
  TemplateConfig,
  TemplateColors,
  OutputFormat,
} from '@careermatch/shared'
import type { ResumeContent } from '@careermatch/shared'
import { BaseResumeRenderer } from './base-renderer'

/**
 * HTML渲染器
 */
export class HTMLRenderer extends BaseResumeRenderer<string> {
  constructor(template: ResumeTemplate) {
    super(template)
    this.validateTemplateSupport()
  }

  getFormat(): OutputFormat {
    return 'html'
  }

  /**
   * 渲染简历为HTML字符串
   */
  async render(content: ResumeContent): Promise<string> {
    const css = this.generateCSS(this.config)
    const html = this.generateHTML(content)

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${content.personalInfo.fullName} - Resume</title>
  <style>
    ${css}
  </style>
</head>
<body>
  <div class="resume-container">
    ${html}
  </div>
  <div class="no-print print-button-container">
    <button onclick="window.print()" class="print-button">
      Print / Save as PDF
    </button>
  </div>
</body>
</html>
    `.trim()
  }

  /**
   * 生成CSS样式
   */
  private generateCSS(config: TemplateConfig): string {
    const { colors, fonts, spacing } = config

    return `
/* 重置和基础样式 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: ${fonts.body}, Arial, sans-serif;
  font-size: ${fonts.bodySize}pt;
  line-height: ${spacing.lineHeight};
  color: ${colors.text};
  background-color: #f5f5f5;
}

.resume-container {
  max-width: 210mm; /* A4 width */
  min-height: 297mm; /* A4 height */
  margin: 20px auto;
  padding: 40px;
  background-color: ${colors.background};
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* Header */
.header {
  margin-bottom: ${spacing.sectionGap * 1.5}px;
  border-bottom: 2px solid ${colors.primary};
  padding-bottom: 15px;
}

.name {
  font-size: ${fonts.headingSize + 6}pt;
  font-family: ${fonts.heading}, Arial, sans-serif;
  font-weight: bold;
  color: ${colors.text};
  margin-bottom: 8px;
}

.contact-row {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
  font-size: ${fonts.bodySize - 1}pt;
  color: ${colors.textLight};
}

/* Sections */
.section {
  margin-bottom: ${spacing.sectionGap}px;
}

.section-title {
  font-size: ${fonts.headingSize}pt;
  font-family: ${fonts.heading}, Arial, sans-serif;
  font-weight: bold;
  color: ${colors.primary};
  margin-bottom: 8px;
  border-bottom: 1px solid ${colors.accent};
  padding-bottom: 4px;
}

/* Skills */
.skills-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.skill-item {
  background-color: ${colors.accent};
  color: ${colors.text};
  padding: 4px 8px;
  border-radius: 4px;
  font-size: ${fonts.bodySize}pt;
}

/* Work Experience */
.experience-item {
  margin-bottom: ${spacing.itemGap}px;
}

.experience-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 2px;
}

.position-title {
  font-size: ${fonts.bodySize + 1}pt;
  font-family: ${fonts.heading}, Arial, sans-serif;
  font-weight: bold;
  color: ${colors.text};
}

.company-text {
  font-size: ${fonts.bodySize}pt;
  color: ${colors.textLight};
  margin-bottom: 4px;
}

.date-text {
  font-size: ${fonts.bodySize - 1}pt;
  color: ${colors.textLight};
  white-space: nowrap;
}

.achievements-list {
  margin-top: 4px;
  padding-left: 20px;
  list-style: none;
}

.achievements-list li {
  margin-bottom: 2px;
  position: relative;
}

.achievements-list li::before {
  content: "•";
  color: ${colors.primary};
  font-weight: bold;
  position: absolute;
  left: -15px;
}

/* Projects */
.project-item {
  margin-bottom: ${spacing.itemGap}px;
}

.project-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 2px;
}

.project-title {
  font-size: ${fonts.bodySize + 1}pt;
  font-family: ${fonts.heading}, Arial, sans-serif;
  font-weight: bold;
  color: ${colors.text};
}

.technologies-text {
  font-size: ${fonts.bodySize - 1}pt;
  color: ${colors.textLight};
  margin-top: 4px;
}

/* Education */
.education-item {
  margin-bottom: ${spacing.itemGap}px;
}

.education-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 2px;
}

.degree-title {
  font-size: ${fonts.bodySize + 1}pt;
  font-family: ${fonts.heading}, Arial, sans-serif;
  font-weight: bold;
  color: ${colors.text};
}

.institution-text {
  font-size: ${fonts.bodySize}pt;
  color: ${colors.textLight};
  margin-bottom: 2px;
}

.gpa-text {
  font-size: ${fonts.bodySize - 1}pt;
  color: ${colors.text};
}

/* Certifications */
.certification-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
}

.certification-name {
  font-size: ${fonts.bodySize}pt;
  color: ${colors.text};
}

.certification-date {
  font-size: ${fonts.bodySize - 1}pt;
  color: ${colors.textLight};
}

/* Print Button */
.print-button-container {
  text-align: center;
  margin: 20px 0;
}

.print-button {
  padding: 12px 24px;
  font-size: 14px;
  background-color: ${colors.primary};
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
}

.print-button:hover {
  opacity: 0.9;
}

/* Print Styles */
@media print {
  @page {
    size: A4;
    margin: 15mm;
  }

  body {
    background-color: white;
  }

  .resume-container {
    max-width: 100%;
    margin: 0;
    padding: 0;
    box-shadow: none;
  }

  .no-print {
    display: none !important;
  }

  /* 避免在打印时截断内容 */
  .section {
    page-break-inside: avoid;
  }

  .experience-item,
  .project-item,
  .education-item {
    page-break-inside: avoid;
  }
}
    `.trim()
  }

  /**
   * 生成HTML内容
   */
  private generateHTML(content: ResumeContent): string {
    const sections: string[] = []

    // Header
    sections.push(this.renderHeader(content.personalInfo))

    // Career Objective
    if (content.careerObjective) {
      sections.push(this.renderSummary(content.careerObjective))
    }

    // Skills
    if (content.skills.length > 0) {
      sections.push(this.renderSkills(content.skills))
    }

    // Work Experience
    if (content.workExperience.length > 0) {
      sections.push(this.renderWorkExperience(content.workExperience))
    }

    // Projects
    if (content.projects.length > 0) {
      sections.push(this.renderProjects(content.projects))
    }

    // Education
    if (content.education.length > 0) {
      sections.push(this.renderEducation(content.education))
    }

    // Certifications
    if (content.certifications.length > 0) {
      sections.push(this.renderCertifications(content.certifications))
    }

    return sections.join('\n\n')
  }

  private renderHeader(personalInfo: ResumeContent['personalInfo']): string {
    const contactItems: string[] = []

    if (personalInfo.email) {
      contactItems.push(`<span>${this.escapeHtml(personalInfo.email)}</span>`)
    }
    if (personalInfo.phone) {
      contactItems.push(`<span>${this.escapeHtml(personalInfo.phone)}</span>`)
    }
    if (personalInfo.location) {
      contactItems.push(`<span>${this.escapeHtml(personalInfo.location)}</span>`)
    }

    return `
<header class="header">
  <h1 class="name">${this.escapeHtml(personalInfo.fullName)}</h1>
  <div class="contact-row">
    ${contactItems.join('\n    ')}
  </div>
</header>
    `.trim()
  }

  private renderSummary(summary: string): string {
    return `
<section class="section">
  <h2 class="section-title">${this.getSectionTitle('summary')}</h2>
  <p>${this.escapeHtml(summary)}</p>
</section>
    `.trim()
  }

  private renderSkills(skills: ResumeContent['skills']): string {
    const skillItems = skills
      .map((skill) => `<span class="skill-item">${this.escapeHtml(skill.name)}</span>`)
      .join('\n    ')

    return `
<section class="section">
  <h2 class="section-title">${this.getSectionTitle('skills')}</h2>
  <div class="skills-container">
    ${skillItems}
  </div>
</section>
    `.trim()
  }

  private renderWorkExperience(
    experiences: ResumeContent['workExperience']
  ): string {
    const items = experiences
      .map(
        (exp) => `
  <div class="experience-item">
    <div class="experience-header">
      <h3 class="position-title">${this.escapeHtml(exp.position)}</h3>
      <span class="date-text">${this.formatDateRange(exp.startDate, exp.endDate)}</span>
    </div>
    <p class="company-text">${this.escapeHtml(exp.company)}</p>
    ${exp.description ? `<p>${this.escapeHtml(exp.description)}</p>` : ''}
    ${
      exp.achievements && exp.achievements.length > 0
        ? `
    <ul class="achievements-list">
      ${exp.achievements
        .map((ach) => `<li>${this.escapeHtml(ach)}</li>`)
        .join('\n      ')}
    </ul>
    `
        : ''
    }
  </div>
      `.trim()
      )
      .join('\n  ')

    return `
<section class="section">
  <h2 class="section-title">${this.getSectionTitle('experience')}</h2>
  ${items}
</section>
    `.trim()
  }

  private renderProjects(projects: ResumeContent['projects']): string {
    const items = projects
      .map(
        (project) => `
  <div class="project-item">
    <div class="project-header">
      <h3 class="project-title">${this.escapeHtml(project.name)}</h3>
      ${
        project.startDate
          ? `<span class="date-text">${this.formatDateRange(
              project.startDate,
              project.endDate
            )}</span>`
          : ''
      }
    </div>
    ${project.description ? `<p>${this.escapeHtml(project.description)}</p>` : ''}
    ${
      project.technologies && project.technologies.length > 0
        ? `<p class="technologies-text">Technologies: ${project.technologies
            .map(this.escapeHtml)
            .join(', ')}</p>`
        : ''
    }
  </div>
      `.trim()
      )
      .join('\n  ')

    return `
<section class="section">
  <h2 class="section-title">${this.getSectionTitle('projects')}</h2>
  ${items}
</section>
    `.trim()
  }

  private renderEducation(education: ResumeContent['education']): string {
    const items = education
      .map(
        (edu) => `
  <div class="education-item">
    <div class="education-header">
      <h3 class="degree-title">${this.escapeHtml(edu.degree)} in ${this.escapeHtml(
          edu.major
        )}</h3>
      ${
        edu.graduationDate
          ? `<span class="date-text">${this.formatDate(
              edu.graduationDate
            )}</span>`
          : ''
      }
    </div>
    <p class="institution-text">${this.escapeHtml(edu.institution)}</p>
    ${edu.gpa ? `<p class="gpa-text">GPA: ${edu.gpa}/4.0</p>` : ''}
  </div>
      `.trim()
      )
      .join('\n  ')

    return `
<section class="section">
  <h2 class="section-title">${this.getSectionTitle('education')}</h2>
  ${items}
</section>
    `.trim()
  }

  private renderCertifications(
    certifications: ResumeContent['certifications']
  ): string {
    const items = certifications
      .map(
        (cert) => `
  <div class="certification-item">
    <span class="certification-name">${this.escapeHtml(cert.name)}</span>
    ${
      cert.issuedDate
        ? `<span class="certification-date">Issued: ${this.formatDate(
            cert.issuedDate
          )}</span>`
        : ''
    }
  </div>
      `.trim()
      )
      .join('\n  ')

    return `
<section class="section">
  <h2 class="section-title">${this.getSectionTitle('certifications')}</h2>
  ${items}
</section>
    `.trim()
  }

  /**
   * HTML转义
   */
  private escapeHtml(text: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    }
    return text.replace(/[&<>"']/g, (m) => map[m])
  }
}
