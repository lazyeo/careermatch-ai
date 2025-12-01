import { SupabaseClient } from '@supabase/supabase-js'
import { ParsedResumeData } from '@careermatch/shared'
import { MemoryManager } from './MemoryManager'

export class ResumeSyncService {
    constructor(
        private supabase: SupabaseClient,
        private memoryManager: MemoryManager
    ) { }

    /**
     * Sync parsed resume data to user profile and extract facts
     */
    async syncResumeToProfile(userId: string, data: ParsedResumeData) {
        console.log(`🔄 Syncing resume data for user ${userId}`)

        try {
            // 1. Sync Basic Profile (if empty)
            await this.syncBasicProfile(userId, data)

            // 2. Sync Collections (Work, Education, Skills, etc.)
            // Note: This replaces existing data for simplicity in this MVP phase.
            // In a real app, we might want to merge or ask for confirmation.
            await this.syncWorkExperience(userId, data)
            await this.syncEducation(userId, data)
            await this.syncSkills(userId, data)
            await this.syncProjects(userId, data)

            // 3. Extract & Save Facts for Agent
            await this.extractAndSaveFacts(userId, data)

            console.log('✅ Resume sync completed successfully')
            return { success: true }
        } catch (error) {
            console.error('❌ Resume sync failed:', error)
            return { success: false, error }
        }
    }

    private async syncBasicProfile(userId: string, data: ParsedResumeData) {
        const { data: profile } = await this.supabase
            .from('user_profiles')
            .select('*')
            .eq('user_id', userId)
            .single()

        const updates: any = {}

        // Always overwrite fields if they exist in the resume
        if (data.personal_info.full_name) {
            updates.full_name = data.personal_info.full_name
        }
        if (data.personal_info.email) {
            updates.email = data.personal_info.email
        }
        if (data.personal_info.phone) {
            updates.phone = data.personal_info.phone
        }
        if (data.personal_info.location) {
            updates.location = data.personal_info.location
        }
        if (data.personal_info.linkedin_url) {
            updates.linkedin_url = data.personal_info.linkedin_url
        }
        if (data.personal_info.professional_summary) {
            updates.professional_summary = data.personal_info.professional_summary
        }

        if (Object.keys(updates).length > 0) {
            await this.supabase
                .from('user_profiles')
                .update(updates)
                .eq('user_id', userId)
        }
    }

    private async syncWorkExperience(userId: string, data: ParsedResumeData) {
        if (!data.work_experiences?.length) return

        // Clear existing (Strategy: Replace all for now)
        await this.supabase.from('work_experiences').delete().eq('user_id', userId)

        const records = data.work_experiences.map((work, index) => ({
            user_id: userId,
            company: work.company,
            position: work.position,
            location: work.location,
            start_date: work.start_date,
            end_date: work.end_date,
            is_current: work.is_current,
            description: work.description,
            achievements: work.achievements,
            technologies: work.technologies,
            display_order: index
        }))

        await this.supabase.from('work_experiences').insert(records)
    }

    private async syncEducation(userId: string, data: ParsedResumeData) {
        if (!data.education?.length) return

        await this.supabase.from('education_records').delete().eq('user_id', userId)

        const records = data.education.map((edu, index) => ({
            user_id: userId,
            institution: edu.institution,
            degree: edu.degree,
            major: edu.major,
            start_date: edu.start_date,
            end_date: edu.end_date,
            is_current: edu.is_current,
            gpa: edu.gpa,
            achievements: edu.achievements,
            display_order: index
        }))

        await this.supabase.from('education_records').insert(records)
    }

    private async syncSkills(userId: string, data: ParsedResumeData) {
        if (!data.skills?.length) return

        await this.supabase.from('user_skills').delete().eq('user_id', userId)

        const records = data.skills.map((skill, index) => ({
            user_id: userId,
            name: skill.name,
            category: skill.category || 'other',
            level: skill.level || 'intermediate',
            display_order: index
        }))

        await this.supabase.from('user_skills').insert(records)
    }

    private async syncProjects(userId: string, data: ParsedResumeData) {
        if (!data.projects?.length) return

        await this.supabase.from('user_projects').delete().eq('user_id', userId)

        const records = data.projects.map((proj, index) => ({
            user_id: userId,
            name: proj.name,
            description: proj.description,
            role: proj.role,
            start_date: proj.start_date,
            end_date: proj.end_date,
            technologies: proj.technologies,
            url: proj.url,
            display_order: index
        }))

        await this.supabase.from('user_projects').insert(records)
    }

    private async extractAndSaveFacts(userId: string, data: ParsedResumeData) {
        // 1. Skills
        if (data.skills?.length) {
            const topSkills = data.skills.slice(0, 10).map(s => s.name).join(', ')
            await this.memoryManager.addFact(userId, {
                category: 'skill',
                content: `User has skills: ${topSkills}`,
                confidence: 0.9,
                source: 'resume_upload'
            })
        }

        // 2. Current Role
        const currentRole = data.work_experiences?.find(w => w.is_current)
        if (currentRole) {
            await this.memoryManager.addFact(userId, {
                category: 'career_goal',
                content: `User is currently working as ${currentRole.position} at ${currentRole.company}`,
                confidence: 0.9,
                source: 'resume_upload'
            })
        }

        // 3. Education
        const education = data.education?.[0]
        if (education) {
            await this.memoryManager.addFact(userId, {
                category: 'other',
                content: `User studied ${education.major} at ${education.institution}`,
                confidence: 0.9,
                source: 'resume_upload'
            })
        }

        // 4. Location
        if (data.personal_info.location) {
            await this.memoryManager.addFact(userId, {
                category: 'preference',
                content: `User is located in ${data.personal_info.location}`,
                confidence: 0.9,
                source: 'resume_upload'
            })
        }
    }
}
