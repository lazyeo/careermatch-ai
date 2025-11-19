/**
 * OAuth回调路由
 *
 * 处理Google OAuth登录/注册后的回调
 * - 交换authorization code获取session
 * - 创建用户session
 * - 重定向到仪表盘
 */

import { createClient } from '@/lib/supabase'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const origin = requestUrl.origin

  if (code) {
    const supabase = createClient()

    // 交换authorization code获取session
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // 登录成功，重定向到仪表盘
      return NextResponse.redirect(`${origin}/dashboard`)
    }

    // 如果发生错误，重定向到登录页并显示错误
    return NextResponse.redirect(
      `${origin}/login?error=oauth_error&message=${encodeURIComponent(error.message)}`
    )
  }

  // 没有code参数，重定向到登录页
  return NextResponse.redirect(`${origin}/login`)
}
