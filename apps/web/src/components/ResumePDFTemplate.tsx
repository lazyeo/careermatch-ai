import React from 'react'
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from '@react-pdf/renderer'
import type { ResumeContent } from '@careermatch/shared'

// 注册字体（可选，用于中文支持）
// Font.register({
//   family: 'Noto Sans SC',
//   src: 'https://fonts.gstatic.com/s/notosanssc/v36/k3kXo84MPvpLmixcA63oeALZTYKL2wv289Kjag.ttf',
// })

// PDF样式
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 20,
    borderBottom: '2 solid #2563EB',
    paddingBottom: 15,
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  contactInfo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    fontSize: 9,
    color: '#6B7280',
  },
  contactItem: {
    marginRight: 15,
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2563EB',
    marginBottom: 8,
    textTransform: 'uppercase',
    borderBottom: '1 solid #E5E7EB',
    paddingBottom: 4,
  },
  text: {
    fontSize: 10,
    color: '#374151',
    lineHeight: 1.5,
  },
  subheading: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 3,
  },
  dateRange: {
    fontSize: 9,
    color: '#6B7280',
    marginBottom: 5,
  },
  bulletList: {
    marginLeft: 15,
    marginTop: 5,
  },
  bulletItem: {
    flexDirection: 'row',
    marginBottom: 3,
  },
  bullet: {
    width: 4,
    height: 4,
    backgroundColor: '#2563EB',
    borderRadius: 2,
    marginRight: 8,
    marginTop: 5,
  },
  bulletText: {
    flex: 1,
    fontSize: 9,
    color: '#4B5563',
    lineHeight: 1.4,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 5,
  },
  skillTag: {
    backgroundColor: '#EEF2FF',
    color: '#3B82F6',
    fontSize: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 3,
    fontWeight: 'bold',
  },
  techStack: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
    marginTop: 5,
  },
  techTag: {
    backgroundColor: '#F3F4F6',
    color: '#6B7280',
    fontSize: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 2,
  },
  workItem: {
    marginBottom: 12,
  },
  projectItem: {
    marginBottom: 12,
  },
  eduItem: {
    marginBottom: 10,
  },
  certItem: {
    marginBottom: 8,
  },
})

interface ResumePDFTemplateProps {
  resume: {
    title: string
    content: ResumeContent
  }
}

export const ResumePDFTemplate: React.FC<ResumePDFTemplateProps> = ({
  resume,
}) => {
  const { content } = resume

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header - Personal Info */}
        <View style={styles.header}>
          <Text style={styles.name}>{content.personalInfo.fullName}</Text>
          <View style={styles.contactInfo}>
            <Text style={styles.contactItem}>{content.personalInfo.email}</Text>
            {content.personalInfo.phone && (
              <Text style={styles.contactItem}>{content.personalInfo.phone}</Text>
            )}
            {content.personalInfo.location && (
              <Text style={styles.contactItem}>
                {content.personalInfo.location}
              </Text>
            )}
            {content.personalInfo.linkedIn && (
              <Text style={styles.contactItem}>
                {content.personalInfo.linkedIn}
              </Text>
            )}
            {content.personalInfo.github && (
              <Text style={styles.contactItem}>
                {content.personalInfo.github}
              </Text>
            )}
          </View>
        </View>

        {/* Career Objective */}
        {content.careerObjective && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Career Objective</Text>
            <Text style={styles.text}>{content.careerObjective}</Text>
          </View>
        )}

        {/* Skills */}
        {content.skills && content.skills.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Skills</Text>
            <View style={styles.skillsContainer}>
              {content.skills.map((skill, index) => (
                <Text key={index} style={styles.skillTag}>
                  {skill.name}
                  {skill.level &&
                    ` (${
                      skill.level === 'beginner'
                        ? 'Beginner'
                        : skill.level === 'intermediate'
                          ? 'Intermediate'
                          : 'Expert'
                    })`}
                </Text>
              ))}
            </View>
          </View>
        )}

        {/* Work Experience */}
        {content.workExperience && content.workExperience.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Work Experience</Text>
            {content.workExperience.map((work, index) => (
              <View key={work.id || index} style={styles.workItem}>
                <Text style={styles.subheading}>
                  {work.position} - {work.company}
                </Text>
                <Text style={styles.dateRange}>
                  {work.startDate} - {work.isCurrent ? 'Present' : work.endDate}
                  {work.location && ` | ${work.location}`}
                </Text>
                {work.description && (
                  <Text style={styles.text}>{work.description}</Text>
                )}
                {work.achievements && work.achievements.length > 0 && (
                  <View style={styles.bulletList}>
                    {work.achievements.map((achievement, idx) => (
                      <View key={idx} style={styles.bulletItem}>
                        <View style={styles.bullet} />
                        <Text style={styles.bulletText}>{achievement}</Text>
                      </View>
                    ))}
                  </View>
                )}
                {work.technologies && work.technologies.length > 0 && (
                  <View style={styles.techStack}>
                    {work.technologies.map((tech, idx) => (
                      <Text key={idx} style={styles.techTag}>
                        {tech}
                      </Text>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Projects */}
        {content.projects && content.projects.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Projects</Text>
            {content.projects.map((project, index) => (
              <View key={project.id || index} style={styles.projectItem}>
                <Text style={styles.subheading}>{project.name}</Text>
                {project.role && (
                  <Text style={styles.dateRange}>{project.role}</Text>
                )}
                {(project.startDate || project.endDate) && (
                  <Text style={styles.dateRange}>
                    {project.startDate} - {project.endDate || 'Present'}
                  </Text>
                )}
                <Text style={styles.text}>{project.description}</Text>
                {project.highlights && project.highlights.length > 0 && (
                  <View style={styles.bulletList}>
                    {project.highlights.map((highlight, idx) => (
                      <View key={idx} style={styles.bulletItem}>
                        <View style={styles.bullet} />
                        <Text style={styles.bulletText}>{highlight}</Text>
                      </View>
                    ))}
                  </View>
                )}
                {project.technologies && project.technologies.length > 0 && (
                  <View style={styles.techStack}>
                    {project.technologies.map((tech, idx) => (
                      <Text key={idx} style={styles.techTag}>
                        {tech}
                      </Text>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Education */}
        {content.education && content.education.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Education</Text>
            {content.education.map((edu, index) => (
              <View key={edu.id || index} style={styles.eduItem}>
                <Text style={styles.subheading}>
                  {edu.degree} in {edu.major}
                </Text>
                <Text style={styles.text}>{edu.institution}</Text>
                <Text style={styles.dateRange}>
                  {edu.startDate} - {edu.endDate}
                  {edu.location && ` | ${edu.location}`}
                </Text>
                {edu.gpa && (
                  <Text style={styles.text}>GPA: {edu.gpa}</Text>
                )}
                {edu.achievements && edu.achievements.length > 0 && (
                  <View style={styles.bulletList}>
                    {edu.achievements.map((achievement, idx) => (
                      <View key={idx} style={styles.bulletItem}>
                        <View style={styles.bullet} />
                        <Text style={styles.bulletText}>{achievement}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Certifications */}
        {content.certifications && content.certifications.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Certifications</Text>
            {content.certifications.map((cert, index) => (
              <View key={cert.id || index} style={styles.certItem}>
                <Text style={styles.subheading}>{cert.name}</Text>
                <Text style={styles.text}>{cert.issuer}</Text>
                <Text style={styles.dateRange}>
                  Issued: {cert.issueDate}
                  {cert.expiryDate && ` | Expires: ${cert.expiryDate}`}
                </Text>
                {cert.credentialId && (
                  <Text style={styles.text}>ID: {cert.credentialId}</Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Interests */}
        {content.interests && content.interests.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Interests</Text>
            <View style={styles.skillsContainer}>
              {content.interests.map((interest, index) => (
                <Text key={index} style={styles.techTag}>
                  {interest}
                </Text>
              ))}
            </View>
          </View>
        )}
      </Page>
    </Document>
  )
}
