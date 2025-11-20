/**
 * Supabase Client for Server (Server Components & API Routes)
 *
 * 用于服务器端的Supabase客户端
 * 使用cookies进行会话管理，支持Server Components和API Routes
 */

import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * 创建服务器端Supabase客户端
 * 用于Server Components和Server Actions
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch {
            // 在Server Component中set可能会失败，这是正常的
            // set操作只在Middleware和Server Actions中有效
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch {
            // 同上
          }
        },
      },
    }
  )
}

/**
 * 获取当前登录用户
 * 便捷函数，用于Server Components
 */
export async function getCurrentUser() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error) {
    console.error('获取用户信息失败:', error)
    return null
  }

  return user
}

/**
 * 获取当前会话
 * 便捷函数，用于Server Components
 */
export async function getSession() {
  const supabase = await createClient()
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession()

  if (error) {
    console.error('获取会话失败:', error)
    return null
  }

  return session
}
