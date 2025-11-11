/**
 * Next.js中间件 - 认证保护和会话管理
 *
 * 功能：
 * 1. 保护需要认证的路由（如/dashboard）
 * 2. 自动刷新Supabase会话
 * 3. 已登录用户访问登录页时重定向到仪表盘
 */

import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // 刷新会话（如果存在）
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // 定义需要保护的路由
  const protectedRoutes = ['/dashboard', '/resumes', '/jobs', '/applications', '/profile']
  const authRoutes = ['/login', '/register']

  const { pathname } = request.nextUrl

  // 检查是否访问受保护的路由
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  )
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route))

  // 未登录用户访问受保护路由 → 重定向到登录页
  if (isProtectedRoute && !user) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/login'
    redirectUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // 已登录用户访问登录/注册页 → 重定向到仪表盘
  if (isAuthRoute && user) {
    const redirectUrl = request.nextUrl.clone()
    // 检查是否有redirect参数
    const redirect = request.nextUrl.searchParams.get('redirect')
    redirectUrl.pathname = redirect || '/dashboard'
    redirectUrl.search = ''
    return NextResponse.redirect(redirectUrl)
  }

  return response
}

// 配置中间件匹配的路径
export const config = {
  matcher: [
    /*
     * 匹配所有路径除了：
     * - _next/static (静态文件)
     * - _next/image (图片优化)
     * - favicon.ico (网站图标)
     * - public文件夹中的文件
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
