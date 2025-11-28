/**
 * 服务端 i18n 请求配置
 *
 * 用于 Server Components 获取翻译内容
 */

import { getRequestConfig } from 'next-intl/server'
import { cookies } from 'next/headers'
import { defaultLocale, locales, LOCALE_COOKIE_NAME, type Locale } from './config'

export default getRequestConfig(async () => {
  // 从 cookie 获取语言设置
  const cookieStore = await cookies()
  const localeCookie = cookieStore.get(LOCALE_COOKIE_NAME)?.value

  // 验证 locale 是否有效
  let locale: Locale = defaultLocale
  if (localeCookie && locales.includes(localeCookie as Locale)) {
    locale = localeCookie as Locale
  }

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  }
})
