'use server'

import { cookies } from 'next/headers'
import { LOCALE_COOKIE_NAME, locales, type Locale } from './config'

/**
 * 设置语言偏好
 */
export async function setLocale(locale: Locale) {
  if (!locales.includes(locale)) {
    throw new Error(`Invalid locale: ${locale}`)
  }

  const cookieStore = await cookies()
  cookieStore.set(LOCALE_COOKIE_NAME, locale, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365, // 1 year
    sameSite: 'lax',
  })
}

/**
 * 获取当前语言
 */
export async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies()
  const locale = cookieStore.get(LOCALE_COOKIE_NAME)?.value as Locale | undefined
  return locale && locales.includes(locale) ? locale : 'zh-CN'
}
