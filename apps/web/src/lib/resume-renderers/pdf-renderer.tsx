/**
 * PDF Resume Renderer
 * 使用@react-pdf/renderer动态生成PDF简历
 * 支持单栏和双栏布局
 */

import React from 'react'
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  renderToBuffer,
} from '@react-pdf/renderer'
import type {
  ResumeTemplate,
  TemplateConfig,
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
    // 根据布局类型选择渲染方法
    if (this.config.layout === 'two-column') {
      return this.renderTwoColumn(content)
    }
    return this.renderSingleColumn(content)
  }

  /**
   * 单栏布局渲染
   */
  private async renderSingleColumn(content: ResumeContent): Promise<Buffer> {
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
                    {edu.endDate && (
                      <Text style={styles.dateText}>
                        {this.formatDate(edu.endDate)}
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
                  {cert.issueDate && (
                    <Text style={styles.certificationDate}>
                      Issued: {this.formatDate(cert.issueDate)}
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
   * 双栏布局渲染
   */
  private async renderTwoColumn(content: ResumeContent): Promise<Buffer> {
    const styles = this.generateTwoColumnStyles(this.config)

    const doc = (
      <Document>
        <Page size="A4" style={styles.page}>
          <View style={styles.container}>
            {/* Left Sidebar - 35% */}
            <View style={styles.sidebar}>
              {/* Name in Sidebar */}
              <View style={styles.sidebarHeader}>
                <Text style={styles.sidebarName}>
                  {content.personalInfo.fullName}
                </Text>
              </View>

              {/* Contact Info */}
              <View style={styles.sidebarSection}>
                <Text style={styles.sidebarSectionTitle}>Contact</Text>
                {content.personalInfo.email && (
                  <Text style={styles.sidebarText}>
                    {content.personalInfo.email}
                  </Text>
                )}
                {content.personalInfo.phone && (
                  <Text style={styles.sidebarText}>
                    {content.personalInfo.phone}
                  </Text>
                )}
                {content.personalInfo.location && (
                  <Text style={styles.sidebarText}>
                    {content.personalInfo.location}
                  </Text>
                )}
                {content.personalInfo.linkedIn && (
                  <Text style={styles.sidebarText}>
                    {content.personalInfo.linkedIn}
                  </Text>
                )}
              </View>

              {/* Skills in Sidebar */}
              {content.skills.length > 0 && (
                <View style={styles.sidebarSection}>
                  <Text style={styles.sidebarSectionTitle}>Skills</Text>
                  {content.skills.map((skill, index) => (
                    <Text key={index} style={styles.skillText}>
                      {skill.name}
                    </Text>
                  ))}
                </View>
              )}

              {/* Certifications in Sidebar */}
              {content.certifications.length > 0 && (
                <View style={styles.sidebarSection}>
                  <Text style={styles.sidebarSectionTitle}>Certifications</Text>
                  {content.certifications.map((cert, index) => (
                    <View key={index} style={styles.certItem}>
                      <Text style={styles.certName}>{cert.name}</Text>
                      {cert.issuer && (
                        <Text style={styles.certIssuer}>{cert.issuer}</Text>
                      )}
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Right Main Content - 65% */}
            <View style={styles.mainContent}>
              {/* Career Objective / Summary */}
              {content.careerObjective && (
                <View style={styles.mainSection}>
                  <Text style={styles.mainSectionTitle}>
                    Professional Summary
                  </Text>
                  <Text style={styles.summaryText}>
                    {content.careerObjective}
                  </Text>
                </View>
              )}

              {/* Work Experience */}
              {content.workExperience.length > 0 && (
                <View style={styles.mainSection}>
                  <Text style={styles.mainSectionTitle}>Experience</Text>
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
                        <Text style={styles.descriptionText}>
                          {exp.description}
                        </Text>
                      )}
                      {exp.achievements && exp.achievements.length > 0 && (
                        <View style={styles.achievementsList}>
                          {exp.achievements.map((achievement, achIndex) => (
                            <View key={achIndex} style={styles.bulletPoint}>
                              <Text style={styles.bullet}>•</Text>
                              <Text style={styles.bulletText}>
                                {achievement}
                              </Text>
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
                <View style={styles.mainSection}>
                  <Text style={styles.mainSectionTitle}>Projects</Text>
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
                        <Text style={styles.descriptionText}>
                          {project.description}
                        </Text>
                      )}
                      {project.technologies &&
                        project.technologies.length > 0 && (
                          <Text style={styles.techText}>
                            {project.technologies.join(' · ')}
                          </Text>
                        )}
                    </View>
                  ))}
                </View>
              )}

              {/* Education */}
              {content.education.length > 0 && (
                <View style={styles.mainSection}>
                  <Text style={styles.mainSectionTitle}>Education</Text>
                  {content.education.map((edu, index) => (
                    <View key={index} style={styles.educationItem}>
                      <View style={styles.educationHeader}>
                        <Text style={styles.degreeTitle}>
                          {edu.degree} in {edu.major}
                        </Text>
                        {edu.endDate && (
                          <Text style={styles.dateText}>
                            {this.formatDate(edu.endDate)}
                          </Text>
                        )}
                      </View>
                      <Text style={styles.institutionText}>
                        {edu.institution}
                      </Text>
                      {edu.gpa && (
                        <Text style={styles.gpaText}>GPA: {edu.gpa}</Text>
                      )}
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        </Page>
      </Document>
    )

    return await renderToBuffer(doc)
  }

  /**
   * 生成双栏布局样式
   */
  private generateTwoColumnStyles(config: TemplateConfig) {
    const { colors, fonts, spacing } = config

    return StyleSheet.create({
      page: {
        backgroundColor: colors.background,
      },
      container: {
        flexDirection: 'row',
        height: '100%',
      },
      // Sidebar styles
      sidebar: {
        width: '35%',
        backgroundColor: colors.secondary || colors.primary,
        padding: 20,
      },
      sidebarHeader: {
        marginBottom: 20,
        paddingBottom: 15,
        borderBottomWidth: 2,
        borderBottomColor: 'rgba(255,255,255,0.3)',
      },
      sidebarName: {
        fontSize: fonts.headingSize + 2,
        fontFamily: fonts.heading,
        color: '#FFFFFF',
        textAlign: 'center',
      },
      sidebarSection: {
        marginBottom: 20,
      },
      sidebarSectionTitle: {
        fontSize: fonts.bodySize + 1,
        fontFamily: fonts.heading,
        color: '#FFFFFF',
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 1,
      },
      sidebarText: {
        fontSize: fonts.bodySize - 1,
        color: 'rgba(255,255,255,0.9)',
        marginBottom: 4,
      },
      skillText: {
        fontSize: fonts.bodySize - 1,
        color: '#FFFFFF',
        marginBottom: 4,
        paddingLeft: 8,
      },
      certItem: {
        marginBottom: 8,
      },
      certName: {
        fontSize: fonts.bodySize - 1,
        color: '#FFFFFF',
      },
      certIssuer: {
        fontSize: fonts.bodySize - 2,
        color: 'rgba(255,255,255,0.7)',
      },
      // Main content styles
      mainContent: {
        width: '65%',
        padding: 25,
        backgroundColor: colors.background,
      },
      mainSection: {
        marginBottom: spacing.sectionGap,
      },
      mainSectionTitle: {
        fontSize: fonts.headingSize,
        fontFamily: fonts.heading,
        color: colors.primary,
        marginBottom: 10,
        paddingBottom: 4,
        borderBottomWidth: 2,
        borderBottomColor: colors.accent,
      },
      summaryText: {
        fontSize: fonts.bodySize,
        color: colors.text,
        lineHeight: spacing.lineHeight,
      },
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
      descriptionText: {
        fontSize: fonts.bodySize,
        color: colors.text,
        marginBottom: 4,
        lineHeight: spacing.lineHeight,
      },
      achievementsList: {
        marginTop: 4,
      },
      bulletPoint: {
        flexDirection: 'row',
        marginBottom: 2,
      },
      bullet: {
        fontSize: fonts.bodySize,
        color: colors.primary,
        marginRight: 6,
        width: 10,
      },
      bulletText: {
        fontSize: fonts.bodySize,
        color: colors.text,
        flex: 1,
      },
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
      techText: {
        fontSize: fonts.bodySize - 1,
        color: colors.primary,
        marginTop: 4,
      },
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
      },
      gpaText: {
        fontSize: fonts.bodySize - 1,
        color: colors.text,
      },
    })
  }

  /**
   * 根据模板配置生成动态样式（单栏）
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
    })
  }
}
