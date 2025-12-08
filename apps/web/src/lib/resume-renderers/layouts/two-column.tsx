/**
 * Two-Column Layout for PDF Resume
 * 双栏布局 - 适合创意型简历
 */

import React from 'react'
import { View, Text, StyleSheet } from '@react-pdf/renderer'
import type { ResumeContent, TemplateConfig } from '@careermatch/shared'

interface TwoColumnLayoutProps {
  content: ResumeContent
  config: TemplateConfig
}

/**
 * 双栏布局组件
 * 左侧35%: 联系信息、技能、证书
 * 右侧65%: 摘要、经验、项目、教育
 */
export function TwoColumnLayout({ content, config }: TwoColumnLayoutProps) {
  const styles = generateTwoColumnStyles(config)

  return (
    <View style={styles.container}>
      {/* Left Sidebar - 35% */}
      <View style={styles.sidebar}>
        {/* Name in Sidebar for Creative Layout */}
        <View style={styles.sidebarHeader}>
          <Text style={styles.sidebarName}>{content.personalInfo.fullName}</Text>
        </View>

        {/* Contact Info */}
        <View style={styles.sidebarSection}>
          <Text style={styles.sidebarSectionTitle}>Contact</Text>
          {content.personalInfo.email && (
            <Text style={styles.sidebarText}>{content.personalInfo.email}</Text>
          )}
          {content.personalInfo.phone && (
            <Text style={styles.sidebarText}>{content.personalInfo.phone}</Text>
          )}
          {content.personalInfo.location && (
            <Text style={styles.sidebarText}>{content.personalInfo.location}</Text>
          )}
          {content.personalInfo.linkedIn && (
            <Text style={styles.sidebarText}>{content.personalInfo.linkedIn}</Text>
          )}
        </View>

        {/* Skills */}
        {content.skills.length > 0 && (
          <View style={styles.sidebarSection}>
            <Text style={styles.sidebarSectionTitle}>Skills</Text>
            {content.skills.map((skill, index) => (
              <View key={index} style={styles.skillItem}>
                <Text style={styles.skillName}>{skill.name}</Text>
                {skill.level && (
                  <View style={styles.skillBar}>
                    <View
                      style={[
                        styles.skillBarFill,
                        { width: `${getSkillLevelPercentage(skill.level)}%` },
                      ]}
                    />
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Certifications */}
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
            <Text style={styles.mainSectionTitle}>Professional Summary</Text>
            <Text style={styles.summaryText}>{content.careerObjective}</Text>
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
                    {formatDateRange(exp.startDate, exp.endDate)}
                  </Text>
                </View>
                <Text style={styles.companyText}>{exp.company}</Text>
                {exp.description && (
                  <Text style={styles.descriptionText}>{exp.description}</Text>
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
          <View style={styles.mainSection}>
            <Text style={styles.mainSectionTitle}>Projects</Text>
            {content.projects.map((project, index) => (
              <View key={index} style={styles.projectItem}>
                <View style={styles.projectHeader}>
                  <Text style={styles.projectTitle}>{project.name}</Text>
                  {project.startDate && (
                    <Text style={styles.dateText}>
                      {formatDateRange(project.startDate, project.endDate)}
                    </Text>
                  )}
                </View>
                {project.description && (
                  <Text style={styles.descriptionText}>{project.description}</Text>
                )}
                {project.technologies && project.technologies.length > 0 && (
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
                    <Text style={styles.dateText}>{formatDate(edu.endDate)}</Text>
                  )}
                </View>
                <Text style={styles.institutionText}>{edu.institution}</Text>
                {edu.gpa && <Text style={styles.gpaText}>GPA: {edu.gpa}</Text>}
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  )
}

/**
 * 获取技能等级百分比
 */
function getSkillLevelPercentage(level: string): number {
  const levelMap: Record<string, number> = {
    beginner: 25,
    intermediate: 50,
    advanced: 75,
    expert: 100,
  }
  return levelMap[level.toLowerCase()] || 50
}

/**
 * 格式化日期范围
 */
function formatDateRange(startDate: string, endDate?: string | null): string {
  const start = formatDate(startDate)
  const end = endDate ? formatDate(endDate) : 'Present'
  return `${start} - ${end}`
}

/**
 * 格式化单个日期
 */
function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
  } catch {
    return dateStr
  }
}

/**
 * 生成双栏布局样式
 */
function generateTwoColumnStyles(config: TemplateConfig) {
  const { colors, fonts, spacing } = config

  return StyleSheet.create({
    container: {
      flexDirection: 'row',
      height: '100%',
    },
    // Sidebar styles
    sidebar: {
      width: '35%',
      backgroundColor: colors.secondary || colors.primary,
      padding: 20,
      color: '#FFFFFF',
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
    skillItem: {
      marginBottom: 8,
    },
    skillName: {
      fontSize: fonts.bodySize - 1,
      color: '#FFFFFF',
      marginBottom: 2,
    },
    skillBar: {
      height: 4,
      backgroundColor: 'rgba(255,255,255,0.3)',
      borderRadius: 2,
    },
    skillBarFill: {
      height: 4,
      backgroundColor: '#FFFFFF',
      borderRadius: 2,
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

export default TwoColumnLayout
