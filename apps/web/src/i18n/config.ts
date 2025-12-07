/**
 * i18n 配置
 */

export const locales = ['zh-CN', 'en'] as const
export type Locale = (typeof locales)[number]

export const defaultLocale: Locale = 'en'

export const localeNames: Record<Locale, string> = {
  'zh-CN': '简体中文',
  en: 'English',
}

// Cookie 名称
export const LOCALE_COOKIE_NAME = 'NEXT_LOCALE'
