'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { Globe, Check, ChevronDown } from 'lucide-react'
import { Button } from '@careermatch/ui'
import { setLocale } from '@/i18n/actions'
import { localeNames, type Locale } from '@/i18n/config'

interface LanguageSwitcherProps {
  variant?: 'default' | 'compact'
}

export function LanguageSwitcher({ variant = 'default' }: LanguageSwitcherProps) {
  const locale = useLocale() as Locale
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isOpen, setIsOpen] = useState(false)

  const handleLocaleChange = (newLocale: Locale) => {
    startTransition(async () => {
      await setLocale(newLocale)
      router.refresh()
      setIsOpen(false)
    })
  }

  if (variant === 'compact') {
    return (
      <div className="relative">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className="gap-1.5 text-gray-600 hover:text-gray-900"
          disabled={isPending}
        >
          <Globe className="w-4 h-4" />
          <span className="text-xs">{locale === 'zh-CN' ? '中文' : 'EN'}</span>
          <ChevronDown className="w-3 h-3" />
        </Button>

        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50 min-w-[120px]">
              {(Object.entries(localeNames) as [Locale, string][]).map(([key, name]) => (
                <button
                  key={key}
                  onClick={() => handleLocaleChange(key)}
                  className="w-full px-3 py-2 text-sm text-left hover:bg-gray-50 flex items-center justify-between"
                  disabled={isPending}
                >
                  <span>{name}</span>
                  {locale === key && <Check className="w-4 h-4 text-primary-600" />}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    )
  }

  return (
    <div className="relative">
      <Button
        variant="secondary"
        onClick={() => setIsOpen(!isOpen)}
        className="gap-2"
        disabled={isPending}
      >
        <Globe className="w-4 h-4" />
        <span>{localeNames[locale]}</span>
        <ChevronDown className="w-4 h-4" />
      </Button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50 min-w-[160px]">
            {(Object.entries(localeNames) as [Locale, string][]).map(([key, name]) => (
              <button
                key={key}
                onClick={() => handleLocaleChange(key)}
                className="w-full px-4 py-2.5 text-sm text-left hover:bg-gray-50 flex items-center justify-between"
                disabled={isPending}
              >
                <span>{name}</span>
                {locale === key && <Check className="w-4 h-4 text-primary-600" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
