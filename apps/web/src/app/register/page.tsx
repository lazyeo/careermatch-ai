/**
 * 注册页面
 *
 * User Story: US-1.1 用户注册
 * - 用户可以使用邮箱、密码和姓名注册账户
 * - 密码强度验证（至少8位，包含字母和数字）
 * - 邮箱格式验证和唯一性检查
 * - 注册成功后自动登录
 * - 自动创建用户profile记录（通过数据库触发器）
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
const registerSchema = z.object({
  fullName: z
    .string()
    .min(1, '请输入您的姓名')
    .min(2, '姓名至少需要2个字符')
    .max(50, '姓名不能超过50个字符'),
  email: z
    .string()
    .min(1, '请输入邮箱地址')
    .email('请输入有效的邮箱地址'),
  password: z
    .string()
    .min(8, '密码至少需要8位字符')
    .regex(/[a-zA-Z]/, '密码必须包含字母')
    .regex(/[0-9]/, '密码必须包含数字'),
  confirmPassword: z
    .string()
    .min(1, '请确认您的密码'),
  agreeToTerms: z
    .boolean()
    .refine((val) => val === true, '请同意服务条款和隐私政策'),
}).refine((data) => data.password === data.confirmPassword, {
  message: '两次输入的密码不一致',
  path: ['confirmPassword'],
})

type RegisterFormData = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
      agreeToTerms: false,
    },
  })

  // 监听密码强度
  const password = watch('password')
  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { strength: 0, label: '', color: '' }

    let strength = 0
    if (pwd.length >= 8) strength++
    if (pwd.length >= 12) strength++
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) strength++
    if (/[0-9]/.test(pwd)) strength++
    if (/[^a-zA-Z0-9]/.test(pwd)) strength++

    if (strength <= 2) return { strength: 1, label: '弱', color: 'bg-error-500' }
    if (strength <= 3) return { strength: 2, label: '中等', color: 'bg-warning-500' }
    return { strength: 3, label: '强', color: 'bg-success-500' }
  }

  const passwordStrength = getPasswordStrength(password)

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setIsLoading(true)
      setErrorMessage(null)

      // 注册用户
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.fullName,
          },
        },
      })

      if (error) {
        // 处理注册错误
        if (error.message.includes('already registered')) {
          setErrorMessage('该邮箱已被注册，请直接登录或使用其他邮箱')
        } else if (error.message.includes('Password')) {
          setErrorMessage('密码不符合安全要求，请重新设置')
        } else {
          setErrorMessage(error.message)
        }
        return
      }

      if (authData.user) {
        // 注册成功
        // 注意：Supabase可能需要邮箱验证，检查session是否存在
        if (authData.session) {
          // 已自动登录，跳转到仪表盘
          router.push('/dashboard')
          router.refresh()
        } else {
          // 需要验证邮箱
          alert('注册成功！请检查您的邮箱并点击验证链接完成注册。')
          router.push('/login')
        }
      }
    } catch (error) {
      console.error('注册失败:', error)
      setErrorMessage('注册过程中发生错误，请稍后重试')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignup = async () => {
    try {
      setIsLoading(true)
      setErrorMessage(null)

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        setErrorMessage('Google注册失败: ' + error.message)
      }
      // OAuth会自动重定向，无需手动跳转
    } catch (error) {
      console.error('Google注册失败:', error)
      setErrorMessage('Google注册过程中发生错误，请稍后重试')
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
          <p className="text-neutral-600">创建您的账户，开启智能求职之旅</p>
        </div>

        {/* 注册表单卡片 */}
        <Card>
          <CardHeader>
            <CardTitle>注册</CardTitle>
            <CardDescription>
              填写以下信息创建您的账户
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

              {/* 姓名输入 */}
              <div>
                <label
                  htmlFor="fullName"
                  className="block text-sm font-medium text-neutral-700 mb-1"
                >
                  姓名
                </label>
                <input
                  {...register('fullName')}
                  id="fullName"
                  type="text"
                  autoComplete="name"
                  placeholder="张三"
                  className={`
                    w-full px-3 py-2 border rounded-lg
                    focus:outline-none focus:ring-2 focus:ring-primary-500
                    ${errors.fullName ? 'border-error-500' : 'border-neutral-300'}
                  `}
                />
                {errors.fullName && (
                  <p className="mt-1 text-sm text-error-600">
                    {errors.fullName.message}
                  </p>
                )}
              </div>

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
                  autoComplete="new-password"
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

                {/* 密码强度指示器 */}
                {password && passwordStrength.strength > 0 && (
                  <div className="mt-2">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="flex-1 h-2 bg-neutral-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${passwordStrength.color} transition-all`}
                          style={{ width: `${(passwordStrength.strength / 3) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-neutral-600">
                        {passwordStrength.label}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-500">
                      建议：至少8位，包含大小写字母、数字和特殊字符
                    </p>
                  </div>
                )}
              </div>

              {/* 确认密码输入 */}
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-neutral-700 mb-1"
                >
                  确认密码
                </label>
                <input
                  {...register('confirmPassword')}
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  className={`
                    w-full px-3 py-2 border rounded-lg
                    focus:outline-none focus:ring-2 focus:ring-primary-500
                    ${errors.confirmPassword ? 'border-error-500' : 'border-neutral-300'}
                  `}
                />
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-error-600">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>

              {/* 同意条款 */}
              <div>
                <label className="flex items-start space-x-2">
                  <input
                    {...register('agreeToTerms')}
                    type="checkbox"
                    className="mt-1 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-neutral-700">
                    我已阅读并同意
                    <a href="/terms" className="text-primary-600 hover:underline mx-1">
                      服务条款
                    </a>
                    和
                    <a href="/privacy" className="text-primary-600 hover:underline mx-1">
                      隐私政策
                    </a>
                  </span>
                </label>
                {errors.agreeToTerms && (
                  <p className="mt-1 text-sm text-error-600">
                    {errors.agreeToTerms.message}
                  </p>
                )}
              </div>

              {/* 注册按钮 */}
              <Button
                type="submit"
                variant="primary"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? '注册中...' : '创建账户'}
              </Button>

              {/* OAuth分割线 */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-neutral-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-neutral-500">
                    或使用以下方式注册
                  </span>
                </div>
              </div>

              {/* Google OAuth 注册按钮 */}
              <Button
                type="button"
                variant="outline"
                className="w-full flex items-center justify-center gap-2"
                onClick={handleGoogleSignup}
                disabled={isLoading}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                使用 Google 账号注册
              </Button>

              {/* 分割线 */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-neutral-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-neutral-500">
                    已有账户？
                  </span>
                </div>
              </div>

              {/* 登录链接 */}
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => router.push('/login')}
              >
                返回登录
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
