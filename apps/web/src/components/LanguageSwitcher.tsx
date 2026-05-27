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

  const handleLocaleChange = async (newLocale: Locale) => {
    await setLocale(newLocale)
    startTransition(() => {
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
          className="gap-1.5 text-ink-2 hover:text-ink"
          disabled={isPending}
        >
          <Globe className="h-4 w-4" />
          <span className="text-xs">{locale === 'zh-CN' ? 'ZH' : 'EN'}</span>
          <ChevronDown className="h-3 w-3" />
        </Button>

        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute right-0 top-full z-50 mt-1 min-w-[120px] rounded-md border border-line bg-surface py-1 shadow-strong">
              {(Object.entries(localeNames) as [Locale, string][]).map(([key, name]) => (
                <button
                  key={key}
                  onClick={() => handleLocaleChange(key)}
                  className="flex w-full items-center justify-between px-3 py-2 text-left text-sm text-ink-2 hover:bg-surface-2 hover:text-ink"
                  disabled={isPending}
                >
                  <span>{name}</span>
                  {locale === key && <Check className="h-4 w-4 text-brick" />}
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
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="gap-2"
        disabled={isPending}
      >
        <Globe className="h-4 w-4" />
        <span>{localeNames[locale]}</span>
        <ChevronDown className="h-4 w-4" />
      </Button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full z-50 mt-2 min-w-[160px] rounded-md border border-line bg-surface py-1 shadow-strong">
            {(Object.entries(localeNames) as [Locale, string][]).map(([key, name]) => (
              <button
                key={key}
                onClick={() => handleLocaleChange(key)}
                className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm text-ink-2 hover:bg-surface-2 hover:text-ink"
                disabled={isPending}
              >
                <span>{name}</span>
                {locale === key && <Check className="h-4 w-4 text-brick" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
