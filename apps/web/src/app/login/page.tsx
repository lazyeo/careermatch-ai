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

import { useState, useEffect, Suspense, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button, Card, CardContent, CardHeader, CardTitle, CardDescription, Field, fieldControlClasses } from '@careermatch/ui'
import { createClient } from '@/lib/supabase'
import { useTranslations } from 'next-intl'
import { AlertCircle } from 'lucide-react'

type LoginFormData = {
  email: string
  password: string
  rememberMe: boolean
}

function LoginPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const supabase = createClient()
  const t = useTranslations('auth')

  // 动态创建 schema 以使用翻译
  const loginSchema = useMemo(() => z.object({
    email: z
      .string()
      .min(1, t('emailRequired'))
      .email(t('emailInvalid')),
    password: z
      .string()
      .min(1, t('passwordRequired'))
      .min(8, t('passwordTooShort')),
    rememberMe: z.boolean().default(false),
  }), [t])

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

  // 检查OAuth回调中的错误
  useEffect(() => {
    const error = searchParams.get('error')
    const message = searchParams.get('message')

    if (error === 'oauth_error' && message) {
      setErrorMessage(decodeURIComponent(message))
    }
  }, [searchParams])

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
          setErrorMessage(t('invalidCredentials'))
        } else if (error.message.includes('Email not confirmed')) {
          setErrorMessage(t('emailNotConfirmed'))
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
      console.error('Login failed:', error)
      setErrorMessage(t('loginError'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true)
      setErrorMessage(null)

      // 使用当前origin作为redirect URL
      const redirectUrl = `${window.location.origin}/auth/callback`
      console.log('OAuth redirect URL:', redirectUrl)

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
        },
      })

      if (error) {
        setErrorMessage(t('googleLoginError') + ': ' + error.message)
      }
      // OAuth会自动重定向，无需手动跳转
    } catch (error) {
      console.error('Google login failed:', error)
      setErrorMessage(t('loginError'))
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper p-4">
      <div className="w-full max-w-md">
        {/* Logo和标题 */}
        <div className="mb-8 text-center">
          <h1 className="mb-2 font-display text-5xl text-ink">
            CareerMatch AI
          </h1>
          <p className="text-ink-2">{t('welcomeBack')}</p>
        </div>

        {/* 登录表单卡片 */}
        <Card>
          <CardHeader>
            <CardTitle>{t('login')}</CardTitle>
            <CardDescription>
              {t('loginDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* 错误提示 */}
              {errorMessage && (
                <div className="flex items-start gap-2 rounded-md border border-clay-soft bg-clay-soft p-3 text-sm text-clay">
                  <AlertCircle className="mt-0.5 h-4 w-4 flex-none" />
                  {errorMessage}
                </div>
              )}

              {/* 邮箱输入 */}
              <Field label={t('emailAddress')} error={errors.email?.message}>
                <input
                  {...register('email')}
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder={t('emailPlaceholder')}
                  className={fieldControlClasses}
                />
              </Field>

              {/* 密码输入 */}
              <Field label={t('password')} error={errors.password?.message}>
                <input
                  {...register('password')}
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder={t('passwordPlaceholder')}
                  className={fieldControlClasses}
                />
              </Field>

              {/* Remember Me 和 忘记密码 */}
              <div className="flex items-center justify-between">
                <label className="flex items-center space-x-2">
                  <input
                    {...register('rememberMe')}
                    type="checkbox"
                    className="rounded border-line-2 text-brick focus:ring-brick"
                  />
                  <span className="text-sm text-ink-2">{t('rememberMe')}</span>
                </label>
              </div>

              {/* 登录按钮 */}
              <Button
                type="submit"
                variant="primary"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? t('loggingIn') : t('login')}
              </Button>

              {/* OAuth分割线 */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-line"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-surface px-2 text-ink-3">
                    {t('orLoginWith')}
                  </span>
                </div>
              </div>

              {/* Google OAuth 登录按钮 */}
              <Button
                type="button"
                variant="secondary"
                className="w-full flex items-center justify-center gap-2"
                onClick={handleGoogleLogin}
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
                {t('loginWithGoogle')}
              </Button>

              {/* 分割线 */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-line"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-surface px-2 text-ink-3">
                    {t('noAccount')}
                  </span>
                </div>
              </div>

              {/* 注册链接 */}
              <Button
                type="button"
                variant="secondary"
                className="w-full"
                onClick={() => router.push('/register')}
              >
                {t('createAccount')}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* 底部说明 */}
        <p className="mt-6 text-center text-sm text-ink-3">
          {t('loginFooter')}
          {' '}
          <span className="mx-1 text-brick">{t('termsOfService')}</span>
          {' '}
          &amp;
          {' '}
          <span className="mx-1 text-brick">{t('privacyPolicy')}</span>
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-paper">Loading...</div>}>
      <LoginPageContent />
    </Suspense>
  )
}
