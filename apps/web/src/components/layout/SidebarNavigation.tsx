'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    LayoutDashboard,
    Briefcase,
    User,
    LogOut,
    Settings
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'

export function SidebarNavigation() {
    const pathname = usePathname()
    const router = useRouter()
    const supabase = createClient()
    const t = useTranslations('nav')

    const NAV_ITEMS = [
        { href: '/dashboard', label: t('dashboard'), icon: LayoutDashboard },
        { href: '/jobs', label: t('jobs'), icon: Briefcase },
        { href: '/profile', label: t('profile'), icon: User },
    ]

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        router.push('/login')
    }

    return (
        <div className="flex flex-col h-full bg-white border-r border-gray-200 w-64 flex-shrink-0">
            <div className="p-6 border-b border-gray-100">
                <Link href="/dashboard" className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center text-white font-bold">
                        CM
                    </div>
                    <span className="font-bold text-xl text-gray-900">CareerMatch</span>
                </Link>
            </div>

            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {NAV_ITEMS.map((item) => {
                    const Icon = item.icon
                    const isActive = pathname.startsWith(item.href)

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                                isActive
                                    ? "bg-primary-50 text-primary-700"
                                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                            )}
                        >
                            <Icon className={cn("w-5 h-5", isActive ? "text-primary-600" : "text-gray-400")} />
                            {item.label}
                        </Link>
                    )
                })}
            </nav>

            <div className="p-4 border-t border-gray-200 space-y-2">
                <div className="px-3 py-2">
                    <LanguageSwitcher />
                </div>
                <Link
                    href="/settings"
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                >
                    <Settings className="w-5 h-5 text-gray-400" />
                    {t('settings')}
                </Link>
                <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors text-left"
                >
                    <LogOut className="w-5 h-5" />
                    {t('logout')}
                </button>
            </div>
        </div>
    )
}
