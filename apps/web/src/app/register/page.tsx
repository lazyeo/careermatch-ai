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

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button, Card, CardContent, CardHeader, CardTitle, CardDescription, Field, fieldControlClasses, ProgressBar } from '@careermatch/ui'
import { createClient } from '@/lib/supabase'
import { useTranslations } from 'next-intl'
import { AlertCircle } from 'lucide-react'

type RegisterFormData = {
  fullName: string
  email: string
  password: string
  confirmPassword: string
  agreeToTerms: boolean
}

export default function RegisterPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const supabase = createClient()
  const t = useTranslations('auth')

  // 动态创建 schema 以使用翻译
  const registerSchema = useMemo(() => z.object({
    fullName: z
      .string()
      .min(1, t('nameRequired'))
      .min(2, t('nameTooShort'))
      .max(50, t('nameTooLong')),
    email: z
      .string()
      .min(1, t('emailRequired'))
      .email(t('emailInvalid')),
    password: z
      .string()
      .min(8, t('passwordTooShort'))
      .regex(/[a-zA-Z]/, t('passwordNeedLetter'))
      .regex(/[0-9]/, t('passwordNeedNumber')),
    confirmPassword: z
      .string()
      .min(1, t('confirmPasswordRequired')),
    agreeToTerms: z
      .boolean()
      .refine((val) => val === true, t('mustAgreeTerms')),
  }).refine((data) => data.password === data.confirmPassword, {
    message: t('passwordMismatch'),
    path: ['confirmPassword'],
  }), [t])

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

    if (strength <= 2) return { strength: 1, label: t('passwordStrength.weak') }
    if (strength <= 3) return { strength: 2, label: t('passwordStrength.medium') }
    return { strength: 3, label: t('passwordStrength.strong') }
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
          setErrorMessage(t('emailAlreadyRegistered'))
        } else if (error.message.includes('Password')) {
          setErrorMessage(t('passwordNotSecure'))
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
          alert(t('registerSuccess'))
          router.push('/login')
        }
      }
    } catch (error) {
      console.error('Registration failed:', error)
      setErrorMessage(t('registerError'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignup = async () => {
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
        setErrorMessage(t('googleRegisterError') + ': ' + error.message)
      }
      // OAuth会自动重定向，无需手动跳转
    } catch (error) {
      console.error('Google registration failed:', error)
      setErrorMessage(t('registerError'))
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
          <p className="text-ink-2">{t('welcomeRegister')}</p>
        </div>

        {/* 注册表单卡片 */}
        <Card>
          <CardHeader>
            <CardTitle>{t('register')}</CardTitle>
            <CardDescription>
              {t('registerDesc')}
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

              {/* 姓名输入 */}
              <Field label={t('fullName')} error={errors.fullName?.message}>
                <input
                  {...register('fullName')}
                  id="fullName"
                  type="text"
                  autoComplete="name"
                  placeholder={t('namePlaceholder')}
                  className={fieldControlClasses}
                />
              </Field>

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
                  autoComplete="new-password"
                  placeholder={t('passwordPlaceholder')}
                  className={fieldControlClasses}
                />

                {/* 密码强度指示器 */}
                {password && passwordStrength.strength > 0 && (
                  <div className="mt-2">
                    <div className="mb-1 flex items-center gap-2">
                      <ProgressBar value={(passwordStrength.strength / 3) * 100} size="thin" tone={passwordStrength.strength === 3 ? 'sage' : passwordStrength.strength === 2 ? 'ochre' : 'clay'} />
                      <span className="text-xs text-ink-2">
                        {passwordStrength.label}
                      </span>
                    </div>
                    <p className="text-xs text-ink-3">
                      {t('passwordHint')}
                    </p>
                  </div>
                )}
              </Field>

              {/* 确认密码输入 */}
              <Field label={t('confirmPassword')} error={errors.confirmPassword?.message}>
                <input
                  {...register('confirmPassword')}
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  placeholder={t('passwordPlaceholder')}
                  className={fieldControlClasses}
                />
              </Field>

              {/* 同意条款 */}
              <div>
                <label className="flex items-start space-x-2">
                  <input
                    {...register('agreeToTerms')}
                    type="checkbox"
                    className="mt-1 rounded border-line-2 text-brick focus:ring-brick"
                  />
                  <span className="text-sm text-ink-2">
                    {t('agreeToTerms')}
                    {' '}
                    <span className="mx-1 text-brick">
                      {t('termsOfService')}
                    </span>
                    {' '}
                    &amp;
                    {' '}
                    <span className="mx-1 text-brick">
                      {t('privacyPolicy')}
                    </span>
                  </span>
                </label>
                {errors.agreeToTerms && (
                  <p className="mt-1 text-sm text-clay">
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
                {isLoading ? t('registering') : t('createAccountBtn')}
              </Button>

              {/* OAuth分割线 */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-line"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-surface px-2 text-ink-3">
                    {t('orRegisterWith')}
                  </span>
                </div>
              </div>

              {/* Google OAuth 注册按钮 */}
              <Button
                type="button"
                variant="secondary"
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
                {t('registerWithGoogle')}
              </Button>

              {/* 分割线 */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-line"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-surface px-2 text-ink-3">
                    {t('hasAccount')}
                  </span>
                </div>
              </div>

              {/* 登录链接 */}
              <Button
                type="button"
                variant="secondary"
                className="w-full"
                onClick={() => router.push('/login')}
              >
                {t('backToLogin')}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
