'use client'

/**
 * 全站共享头部组件
 *
 * 包含 Logo、导航、用户信息和语言切换
 */

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@careermatch/ui'
import { LanguageSwitcher } from './LanguageSwitcher'
import { useTranslations } from 'next-intl'

interface AppHeaderProps {
  user?: {
    email?: string
    name?: string
  }
  showNav?: boolean
}

export function AppHeader({ user, showNav = true }: AppHeaderProps) {
  const pathname = usePathname()
  const t = useTranslations('nav')

  const navItems = [
    { href: '/dashboard', label: t('dashboard') },
    { href: '/jobs', label: t('jobs') },
    { href: '/resumes', label: t('resumes') },
    { href: '/profile', label: t('profile') },
  ]

  return (
    <header className="bg-white border-b border-neutral-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-8">
            <Link href="/dashboard">
              <h1 className="text-2xl font-bold text-primary-600">
                CareerMatch AI
              </h1>
            </Link>

            {/* Navigation */}
            {showNav && (
              <nav className="hidden md:flex items-center gap-1">
                {navItems.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-primary-50 text-primary-700'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      {item.label}
                    </Link>
                  )
                })}
              </nav>
            )}
          </div>

          {/* Right side: Language switcher + User info */}
          <div className="flex items-center gap-4">
            <LanguageSwitcher variant="compact" />

            {user && (
              <>
                <span className="text-sm text-neutral-600 hidden sm:block">
                  {user.name || user.email}
                </span>
                <form action="/auth/signout" method="post">
                  <Button type="submit" variant="outline" size="sm">
                    {t('logout')}
                  </Button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
