/**
 * Single-Column Layout for PDF Resume
 * 单栏布局 - 传统简历样式
 */

import React from 'react'
import { View, Text, StyleSheet } from '@react-pdf/renderer'
import type { ResumeContent, TemplateConfig } from '@careermatch/shared'

interface SingleColumnLayoutProps {
  content: ResumeContent
  config: TemplateConfig
}

/**
 * 单栏布局组件
 * 传统的从上到下排列
 */
export function SingleColumnLayout({ content, config }: SingleColumnLayoutProps) {
  const styles = generateSingleColumnStyles(config)

  // 根据配置的sections_order排序
  const sections = renderSections(content, config, styles)

  return <View style={styles.container}>{sections}</View>
}

/**
 * 根据sections_order渲染各个部分
 */
function renderSections(
  content: ResumeContent,
  config: TemplateConfig,
  styles: ReturnType<typeof generateSingleColumnStyles>
) {
  const sectionOrder = config.sections_order || [
    'header',
    'summary',
    'skills',
    'experience',
    'projects',
    'education',
    'certifications',
  ]

  return sectionOrder.map((sectionKey) => {
    switch (sectionKey) {
      case 'header':
        return <HeaderSection key={sectionKey} content={content} styles={styles} />
      case 'summary':
        return content.careerObjective ? (
          <SummarySection
            key={sectionKey}
            summary={content.careerObjective}
            styles={styles}
          />
        ) : null
      case 'skills':
        return content.skills.length > 0 ? (
          <SkillsSection key={sectionKey} skills={content.skills} styles={styles} />
        ) : null
      case 'experience':
        return content.workExperience.length > 0 ? (
          <ExperienceSection
            key={sectionKey}
            experiences={content.workExperience}
            styles={styles}
          />
        ) : null
      case 'projects':
        return content.projects.length > 0 ? (
          <ProjectsSection
            key={sectionKey}
            projects={content.projects}
            styles={styles}
          />
        ) : null
      case 'education':
        return content.education.length > 0 ? (
          <EducationSection
            key={sectionKey}
            education={content.education}
            styles={styles}
          />
        ) : null
      case 'certifications':
        return content.certifications.length > 0 ? (
          <CertificationsSection
            key={sectionKey}
            certifications={content.certifications}
            styles={styles}
          />
        ) : null
      default:
        return null
    }
  })
}

/**
 * Header Section
 */
function HeaderSection({
  content,
  styles,
}: {
  content: ResumeContent
  styles: ReturnType<typeof generateSingleColumnStyles>
}) {
  return (
    <View style={styles.header}>
      <Text style={styles.name}>{content.personalInfo.fullName}</Text>
      <View style={styles.contactRow}>
        {content.personalInfo.email && (
          <Text style={styles.contactText}>{content.personalInfo.email}</Text>
        )}
        {content.personalInfo.phone && (
          <Text style={styles.contactText}>{content.personalInfo.phone}</Text>
        )}
        {content.personalInfo.location && (
          <Text style={styles.contactText}>{content.personalInfo.location}</Text>
        )}
      </View>
      {content.personalInfo.linkedIn && (
        <Text style={styles.linkedInText}>{content.personalInfo.linkedIn}</Text>
      )}
    </View>
  )
}

/**
 * Summary Section
 */
function SummarySection({
  summary,
  styles,
}: {
  summary: string
  styles: ReturnType<typeof generateSingleColumnStyles>
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Professional Summary</Text>
      <Text style={styles.bodyText}>{summary}</Text>
    </View>
  )
}

/**
 * Skills Section
 */
function SkillsSection({
  skills,
  styles,
}: {
  skills: ResumeContent['skills']
  styles: ReturnType<typeof generateSingleColumnStyles>
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Skills</Text>
      <View style={styles.skillsContainer}>
        {skills.map((skill, index) => (
          <Text key={index} style={styles.skillItem}>
            {skill.name}
          </Text>
        ))}
      </View>
    </View>
  )
}

/**
 * Experience Section
 */
function ExperienceSection({
  experiences,
  styles,
}: {
  experiences: ResumeContent['workExperience']
  styles: ReturnType<typeof generateSingleColumnStyles>
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Work Experience</Text>
      {experiences.map((exp, index) => (
        <View key={index} style={styles.experienceItem}>
          <View style={styles.experienceHeader}>
            <Text style={styles.positionTitle}>{exp.position}</Text>
            <Text style={styles.dateText}>
              {formatDateRange(exp.startDate, exp.endDate)}
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
  )
}

/**
 * Projects Section
 */
function ProjectsSection({
  projects,
  styles,
}: {
  projects: ResumeContent['projects']
  styles: ReturnType<typeof generateSingleColumnStyles>
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Projects</Text>
      {projects.map((project, index) => (
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
  )
}

/**
 * Education Section
 */
function EducationSection({
  education,
  styles,
}: {
  education: ResumeContent['education']
  styles: ReturnType<typeof generateSingleColumnStyles>
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Education</Text>
      {education.map((edu, index) => (
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
  )
}

/**
 * Certifications Section
 */
function CertificationsSection({
  certifications,
  styles,
}: {
  certifications: ResumeContent['certifications']
  styles: ReturnType<typeof generateSingleColumnStyles>
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Certifications</Text>
      {certifications.map((cert, index) => (
        <View key={index} style={styles.certificationItem}>
          <Text style={styles.certificationName}>{cert.name}</Text>
          {cert.issueDate && (
            <Text style={styles.certificationDate}>
              Issued: {formatDate(cert.issueDate)}
            </Text>
          )}
        </View>
      ))}
    </View>
  )
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
 * 生成单栏布局样式
 */
function generateSingleColumnStyles(config: TemplateConfig) {
  const { colors, fonts, spacing } = config

  return StyleSheet.create({
    container: {
      flexDirection: 'column',
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
    linkedInText: {
      fontSize: fonts.bodySize - 1,
      color: colors.primary,
      marginTop: 4,
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

export default SingleColumnLayout
