/**
 * Supabase Client for Browser (Client Components)
 *
 * 用于客户端组件的Supabase客户端
 * 使用浏览器环境的localStorage进行会话管理
 */

import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@careermatch/shared'

/**
 * 创建浏览器端Supabase客户端
 * 用于Client Components和客户端交互
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

/**
 * 单例模式的浏览器客户端
 * 避免重复创建客户端实例
 */
let supabaseClient: ReturnType<typeof createClient> | null = null

export function getSupabaseClient() {
  if (!supabaseClient) {
    supabaseClient = createClient()
  }
  return supabaseClient
}
