/**
 * 退出登录API路由
 *
 * POST /auth/signout
 * 退出当前用户登录并清除会话
 */

import { createClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()

  // 退出登录
  const { error } = await supabase.auth.signOut()

  if (error) {
    console.error('退出登录失败:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // 清除缓存
  revalidatePath('/', 'layout')

  // 重定向到登录页
  redirect('/login')
}
