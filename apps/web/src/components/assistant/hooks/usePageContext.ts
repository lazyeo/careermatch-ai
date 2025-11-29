'use client'

/**
 * 页面上下文 Hook
 *
 * 检测当前页面类型，加载相关数据，并更新助手上下文
 */

import { useEffect, useCallback, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { useAssistantStore } from '@/stores/assistant-store'
import {
  createPageContext,
  detectPageType,
  extractPathParams,
} from '@/lib/ai/prompts/builders/context-builder'
import type {
  PageType,
  PageContext,
  JobContext,
  ProfileContext,
} from '@/lib/ai/prompts/types'

interface PageContextState {
  pageContext: PageContext
  isLoading: boolean
  error: string | null
}

/**
 * 检测页面上下文并加载相关数据
 */
export function usePageContext(): PageContextState {
  const pathname = usePathname()
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { updateContext, currentContext: _currentContext } = useAssistantStore()
  const fetchingRef = useRef<string | null>(null)

  // 创建页面上下文
  const pageContext = createPageContext(pathname)

  // 加载岗位数据
  const fetchJobData = useCallback(async (jobId: string): Promise<JobContext | null> => {
    try {
      const response = await fetch(`/api/jobs/${jobId}`)
      if (!response.ok) {
        return null
      }

      const data = await response.json()

      // API直接返回job对象，不是包在{ job: ... }里
      if (!data || !data.id) {
        return null
      }

      const jobContext: JobContext = {
        id: data.id,
        title: data.title,
        company: data.company,
        location: data.location || undefined,
        jobType: data.job_type || data.jobType || undefined,
        description: data.description || undefined,
        requirements: data.requirements || undefined,
        salaryMin: data.salary_min || data.salaryMin || undefined,
        salaryMax: data.salary_max || data.salaryMax || undefined,
        salaryCurrency: data.salary_currency || data.salaryCurrency || undefined,
      }

      return jobContext
    } catch (error) {
      console.error('Failed to fetch job data:', error)
      return null
    }
  }, [])

  // 加载 Profile 数据
  const fetchProfileData = useCallback(async (): Promise<ProfileContext | null> => {
    try {
      const response = await fetch('/api/profile')
      if (!response.ok) return null

      const data = await response.json()
      if (!data.profile) return null

      return {
        id: data.profile.id,
        fullName: data.profile.full_name || data.profile.fullName || '',
        email: data.profile.email || undefined,
        phone: data.profile.phone || undefined,
        location: data.profile.location || undefined,
        professionalSummary: data.profile.professional_summary || undefined,
        hasWorkExperience: (data.workExperience?.length || 0) > 0,
        hasEducation: (data.education?.length || 0) > 0,
        hasSkills: (data.skills?.length || 0) > 0,
      }
    } catch (error) {
      console.error('Failed to fetch profile data:', error)
      return null
    }
  }, [])

  // 根据页面类型加载上下文数据
  const loadContextData = useCallback(async () => {
    const pageType = pageContext.type
    const params = pageContext.params || {}

    // 防止重复请求
    const fetchKey = `${pathname}-${JSON.stringify(params)}`
    if (fetchingRef.current === fetchKey) {
      return
    }
    fetchingRef.current = fetchKey

    try {
      // 总是先更新页面上下文
      updateContext({ currentPage: pageContext })

      // 根据页面类型加载额外数据
      switch (pageType) {
        case 'job-detail':
        case 'job-analysis':
        case 'job-cover-letter':
          if (params.jobId) {
            const jobData = await fetchJobData(params.jobId)
            if (jobData) {
              updateContext({ activeJob: jobData })
            }
          }
          break

        case 'profile':
        case 'profile-edit':
        case 'profile-upload':
          const profileData = await fetchProfileData()
          if (profileData) {
            updateContext({ profile: profileData })
          }
          break

        case 'dashboard':
          // 仪表盘页面加载 Profile 摘要
          const dashboardProfile = await fetchProfileData()
          if (dashboardProfile) {
            updateContext({ profile: dashboardProfile })
          }
          break

        default:
          // 其他页面清除特定上下文
          break
      }
    } catch (error) {
      console.error('Failed to load context data:', error)
    } finally {
      fetchingRef.current = null
    }
  }, [pathname, pageContext, updateContext, fetchJobData, fetchProfileData])

  // 监听路径变化，加载上下文
  useEffect(() => {
    loadContextData()
  }, [loadContextData])

  return {
    pageContext,
    isLoading: fetchingRef.current !== null,
    error: null,
  }
}

/**
 * 获取当前页面类型
 */
export function useCurrentPageType(): PageType {
  const pathname = usePathname()
  return detectPageType(pathname)
}

/**
 * 获取当前页面参数
 */
export function useCurrentPageParams(): Record<string, string> {
  const pathname = usePathname()
  return extractPathParams(pathname)
}

/**
 * 检查是否在特定页面类型
 */
export function useIsPageType(...types: PageType[]): boolean {
  const currentType = useCurrentPageType()
  return types.includes(currentType)
}

/**
 * 获取当前岗位ID（如果在岗位相关页面）
 */
export function useCurrentJobId(): string | null {
  const params = useCurrentPageParams()
  return params.jobId || null
}

/**
 * 获取当前简历ID（如果在简历相关页面）
 */
export function useCurrentResumeId(): string | null {
  const params = useCurrentPageParams()
  return params.resumeId || null
}
