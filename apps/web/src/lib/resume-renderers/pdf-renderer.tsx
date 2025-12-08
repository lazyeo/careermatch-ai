/**
 * PDF Resume Renderer
 * 使用@react-pdf/renderer动态生成PDF简历
 */

import React from 'react'
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  renderToBuffer,
} from '@react-pdf/renderer'
import type { Style } from '@react-pdf/types'
import type {
  ResumeTemplate,
  TemplateConfig,
  TemplateColors,
  OutputFormat,
} from '@careermatch/shared'
import type { ResumeContent } from '@careermatch/shared'
import { BaseResumeRenderer } from './base-renderer'

/**
 * PDF渲染器
 */
export class PDFRenderer extends BaseResumeRenderer<Buffer> {
  constructor(template: ResumeTemplate) {
    super(template)
    this.validateTemplateSupport()
  }

  getFormat(): OutputFormat {
    return 'pdf'
  }

  /**
   * 渲染简历为PDF Buffer
   */
  async render(content: ResumeContent): Promise<Buffer> {
    const styles = this.generateStyles(this.config)

    const doc = (
      <Document>
        <Page size="A4" style={styles.page}>
          {/* Header - Personal Info */}
          <View style={styles.header}>
            <Text style={styles.name}>{content.personalInfo.fullName}</Text>
            <View style={styles.contactRow}>
              {content.personalInfo.email && (
                <Text style={styles.contactText}>
                  {content.personalInfo.email}
                </Text>
              )}
              {content.personalInfo.phone && (
                <Text style={styles.contactText}>
                  {content.personalInfo.phone}
                </Text>
              )}
              {content.personalInfo.location && (
                <Text style={styles.contactText}>
                  {content.personalInfo.location}
                </Text>
              )}
            </View>
          </View>

          {/* Career Objective / Summary */}
          {content.careerObjective && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {this.getSectionTitle('summary')}
              </Text>
              <Text style={styles.bodyText}>{content.careerObjective}</Text>
            </View>
          )}

          {/* Skills */}
          {content.skills.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {this.getSectionTitle('skills')}
              </Text>
              <View style={styles.skillsContainer}>
                {content.skills.map((skill, index) => (
                  <Text key={index} style={styles.skillItem}>
                    {skill.name}
                  </Text>
                ))}
              </View>
            </View>
          )}

          {/* Work Experience */}
          {content.workExperience.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {this.getSectionTitle('experience')}
              </Text>
              {content.workExperience.map((exp, index) => (
                <View key={index} style={styles.experienceItem}>
                  <View style={styles.experienceHeader}>
                    <Text style={styles.positionTitle}>{exp.position}</Text>
                    <Text style={styles.dateText}>
                      {this.formatDateRange(exp.startDate, exp.endDate)}
                    </Text>
                  </View>
                  <Text style={styles.companyText}>{exp.company}</Text>
                  {exp.description && (
                    <Text style={styles.bodyText}>{exp.description}</Text>
                  )}
                  {exp.achievements && exp.achievements.length > 0 && (
                    <View style={styles.achievementsList}>
                      {exp.achievements.map((achievement, achIndex) => (
                        <View key={achIndex} style={styles.bulletPoint}>
                          <Text style={styles.bullet}>•</Text>
                          <Text style={styles.bulletText}>{achievement}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}

          {/* Projects */}
          {content.projects.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {this.getSectionTitle('projects')}
              </Text>
              {content.projects.map((project, index) => (
                <View key={index} style={styles.projectItem}>
                  <View style={styles.projectHeader}>
                    <Text style={styles.projectTitle}>{project.name}</Text>
                    {project.startDate && (
                      <Text style={styles.dateText}>
                        {this.formatDateRange(
                          project.startDate,
                          project.endDate
                        )}
                      </Text>
                    )}
                  </View>
                  {project.description && (
                    <Text style={styles.bodyText}>{project.description}</Text>
                  )}
                  {project.technologies && project.technologies.length > 0 && (
                    <Text style={styles.technologiesText}>
                      Technologies: {project.technologies.join(', ')}
                    </Text>
                  )}
                </View>
              ))}
            </View>
          )}

          {/* Education */}
          {content.education.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {this.getSectionTitle('education')}
              </Text>
              {content.education.map((edu, index) => (
                <View key={index} style={styles.educationItem}>
                  <View style={styles.educationHeader}>
                    <Text style={styles.degreeTitle}>
                      {edu.degree} in {edu.major}
                    </Text>
                    {edu.graduationDate && (
                      <Text style={styles.dateText}>
                        {this.formatDate(edu.graduationDate)}
                      </Text>
                    )}
                  </View>
                  <Text style={styles.institutionText}>{edu.institution}</Text>
                  {edu.gpa && (
                    <Text style={styles.gpaText}>GPA: {edu.gpa}/4.0</Text>
                  )}
                </View>
              ))}
            </View>
          )}

          {/* Certifications */}
          {content.certifications.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {this.getSectionTitle('certifications')}
              </Text>
              {content.certifications.map((cert, index) => (
                <View key={index} style={styles.certificationItem}>
                  <Text style={styles.certificationName}>{cert.name}</Text>
                  {cert.issuedDate && (
                    <Text style={styles.certificationDate}>
                      Issued: {this.formatDate(cert.issuedDate)}
                    </Text>
                  )}
                </View>
              ))}
            </View>
          )}
        </Page>
      </Document>
    )

    return await renderToBuffer(doc)
  }

  /**
   * 根据模板配置生成动态样式
   */
  private generateStyles(config: TemplateConfig) {
    const { colors, fonts, spacing } = config

    return StyleSheet.create({
      page: {
        flexDirection: 'column',
        backgroundColor: colors.background,
        padding: 40,
        fontSize: fonts.bodySize,
        fontFamily: fonts.body,
        lineHeight: spacing.lineHeight,
      },
      header: {
        marginBottom: 20,
        borderBottomWidth: 2,
        borderBottomColor: colors.primary,
        paddingBottom: 15,
      },
      name: {
        fontSize: fonts.headingSize + 6,
        fontFamily: fonts.heading,
        color: colors.text,
        marginBottom: 8,
      },
      contactRow: {
        flexDirection: 'row',
        gap: 15,
        flexWrap: 'wrap',
      },
      contactText: {
        fontSize: fonts.bodySize - 1,
        color: colors.textLight,
      },
      section: {
        marginBottom: spacing.sectionGap,
      },
      sectionTitle: {
        fontSize: fonts.headingSize,
        fontFamily: fonts.heading,
        color: colors.primary,
        marginBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: colors.accent,
        paddingBottom: 4,
      },
      bodyText: {
        fontSize: fonts.bodySize,
        color: colors.text,
        marginBottom: 4,
        lineHeight: spacing.lineHeight,
      },
      // Skills
      skillsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
      },
      skillItem: {
        fontSize: fonts.bodySize,
        color: colors.text,
        backgroundColor: colors.accent,
        padding: '4 8',
        borderRadius: 4,
      },
      // Work Experience
      experienceItem: {
        marginBottom: spacing.itemGap,
      },
      experienceHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 2,
      },
      positionTitle: {
        fontSize: fonts.bodySize + 1,
        fontFamily: fonts.heading,
        color: colors.text,
      },
      companyText: {
        fontSize: fonts.bodySize,
        color: colors.textLight,
        marginBottom: 4,
      },
      dateText: {
        fontSize: fonts.bodySize - 1,
        color: colors.textLight,
      },
      achievementsList: {
        marginTop: 4,
        paddingLeft: 10,
      },
      bulletPoint: {
        flexDirection: 'row',
        marginBottom: 2,
      },
      bullet: {
        fontSize: fonts.bodySize,
        color: colors.primary,
        marginRight: 6,
      },
      bulletText: {
        fontSize: fonts.bodySize,
        color: colors.text,
        flex: 1,
      },
      // Projects
      projectItem: {
        marginBottom: spacing.itemGap,
      },
      projectHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 2,
      },
      projectTitle: {
        fontSize: fonts.bodySize + 1,
        fontFamily: fonts.heading,
        color: colors.text,
      },
      technologiesText: {
        fontSize: fonts.bodySize - 1,
        color: colors.textLight,
        marginTop: 4,
      },
      // Education
      educationItem: {
        marginBottom: spacing.itemGap,
      },
      educationHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 2,
      },
      degreeTitle: {
        fontSize: fonts.bodySize + 1,
        fontFamily: fonts.heading,
        color: colors.text,
      },
      institutionText: {
        fontSize: fonts.bodySize,
        color: colors.textLight,
        marginBottom: 2,
      },
      gpaText: {
        fontSize: fonts.bodySize - 1,
        color: colors.text,
      },
      // Certifications
      certificationItem: {
        marginBottom: 6,
        flexDirection: 'row',
        justifyContent: 'space-between',
      },
      certificationName: {
        fontSize: fonts.bodySize,
        color: colors.text,
      },
      certificationDate: {
        fontSize: fonts.bodySize - 1,
        color: colors.textLight,
      },
    } as Record<string, Style>)
  }
}
