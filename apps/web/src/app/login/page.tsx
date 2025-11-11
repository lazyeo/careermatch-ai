/**
 * 登录页面
 *
 * User Story: US-1.2 用户登录
 * - 用户可以使用邮箱和密码登录
 * - 登录失败显示错误信息
 * - 登录成功跳转到仪表盘
 * - 保持登录状态（Remember Me）
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button, Card, CardContent, CardHeader, CardTitle, CardDescription } from '@careermatch/ui'
import { createClient } from '@/lib/supabase'

// 表单验证Schema
const loginSchema = z.object({
  email: z
    .string()
    .min(1, '请输入邮箱地址')
    .email('请输入有效的邮箱地址'),
  password: z
    .string()
    .min(1, '请输入密码')
    .min(8, '密码至少需要8位字符'),
  rememberMe: z.boolean().default(false),
})

type LoginFormData = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  })

  const onSubmit = async (data: LoginFormData) => {
    try {
      setIsLoading(true)
      setErrorMessage(null)

      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })

      if (error) {
        // 处理登录错误
        if (error.message.includes('Invalid login credentials')) {
          setErrorMessage('邮箱或密码错误，请重试')
        } else if (error.message.includes('Email not confirmed')) {
          setErrorMessage('请先验证您的邮箱地址')
        } else {
          setErrorMessage(error.message)
        }
        return
      }

      if (authData.user) {
        // 登录成功，跳转到仪表盘
        router.push('/dashboard')
        router.refresh()
      }
    } catch (error) {
      console.error('登录失败:', error)
      setErrorMessage('登录过程中发生错误，请稍后重试')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo和标题 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary-600 mb-2">
            CareerMatch AI
          </h1>
          <p className="text-neutral-600">欢迎回来！请登录您的账户</p>
        </div>

        {/* 登录表单卡片 */}
        <Card>
          <CardHeader>
            <CardTitle>登录</CardTitle>
            <CardDescription>
              使用您的邮箱和密码登录
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* 错误提示 */}
              {errorMessage && (
                <div className="p-3 rounded-lg bg-error-50 border border-error-300 text-error-700 text-sm">
                  {errorMessage}
                </div>
              )}

              {/* 邮箱输入 */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-neutral-700 mb-1"
                >
                  邮箱地址
                </label>
                <input
                  {...register('email')}
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="your@email.com"
                  className={`
                    w-full px-3 py-2 border rounded-lg
                    focus:outline-none focus:ring-2 focus:ring-primary-500
                    ${errors.email ? 'border-error-500' : 'border-neutral-300'}
                  `}
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-error-600">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* 密码输入 */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-neutral-700 mb-1"
                >
                  密码
                </label>
                <input
                  {...register('password')}
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className={`
                    w-full px-3 py-2 border rounded-lg
                    focus:outline-none focus:ring-2 focus:ring-primary-500
                    ${errors.password ? 'border-error-500' : 'border-neutral-300'}
                  `}
                />
                {errors.password && (
                  <p className="mt-1 text-sm text-error-600">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Remember Me 和 忘记密码 */}
              <div className="flex items-center justify-between">
                <label className="flex items-center space-x-2">
                  <input
                    {...register('rememberMe')}
                    type="checkbox"
                    className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-neutral-700">记住我</span>
                </label>

                <a
                  href="/forgot-password"
                  className="text-sm text-primary-600 hover:text-primary-700 hover:underline"
                >
                  忘记密码？
                </a>
              </div>

              {/* 登录按钮 */}
              <Button
                type="submit"
                variant="primary"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? '登录中...' : '登录'}
              </Button>

              {/* 分割线 */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-neutral-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-neutral-500">
                    还没有账户？
                  </span>
                </div>
              </div>

              {/* 注册链接 */}
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => router.push('/register')}
              >
                创建新账户
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* 底部说明 */}
        <p className="mt-6 text-center text-sm text-neutral-600">
          登录即表示您同意我们的
          <a href="/terms" className="text-primary-600 hover:underline mx-1">
            服务条款
          </a>
          和
          <a href="/privacy" className="text-primary-600 hover:underline mx-1">
            隐私政策
          </a>
        </p>
      </div>
    </div>
  )
}
