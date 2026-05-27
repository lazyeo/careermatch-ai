'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    LayoutDashboard,
    Briefcase,
    User,
    LogOut,
    Settings,
    FileText,
    Inbox,
    Sparkles
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
        { href: '/applications', label: t('applications'), icon: Inbox },
        { href: '/resumes', label: t('resumes'), icon: FileText },
        { href: '/profile', label: t('profile'), icon: User },
        { href: '/assistant', label: 'AI Copilot', icon: Sparkles },
    ]

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        router.push('/login')
    }

    const isActiveRoute = (href: string) => pathname === href || pathname.startsWith(`${href}/`)

    return (
        <>
            <div className="fixed inset-x-0 top-0 z-40 flex h-16 items-center justify-between border-b border-line bg-paper-tint px-4 md:hidden">
                <Link href="/dashboard" className="flex items-center gap-2">
                    <div className="grid h-8 w-8 place-items-center rounded-sm bg-ink font-display text-base italic text-paper">
                        C
                    </div>
                    <span className="font-display text-xl text-ink">CareerMatch</span>
                </Link>
                <div className="flex items-center gap-1">
                    <LanguageSwitcher variant="compact" />
                    <Link
                        href="/assistant"
                        className={cn(
                            "grid h-9 w-9 place-items-center rounded-md text-ink-3 transition hover:bg-surface-2 hover:text-ink",
                            isActiveRoute('/assistant') && "bg-surface text-brick shadow-xs"
                        )}
                        aria-label="AI Copilot"
                    >
                        <Sparkles className="h-4 w-4" />
                    </Link>
                </div>
            </div>

            <aside className="hidden h-full w-64 flex-shrink-0 flex-col border-r border-line bg-paper-tint md:flex">
                <div className="border-b border-line px-5 py-5">
                    <Link href="/dashboard" className="flex items-center gap-3">
                        <div className="grid h-9 w-9 place-items-center rounded-sm bg-ink font-display text-lg italic text-paper shadow-xs">
                            C
                        </div>
                        <div>
                            <span className="block font-display text-2xl leading-none text-ink">CareerMatch</span>
                            <span className="mt-1 block text-xs text-ink-3">Warm Studio</span>
                        </div>
                    </Link>
                </div>

                <nav className="flex-1 space-y-1 overflow-y-auto p-3">
                    {NAV_ITEMS.map((item) => {
                        const Icon = item.icon
                        const isActive = isActiveRoute(item.href)

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex h-9 items-center gap-3 rounded-md px-3 text-sm font-medium tracking-normal transition",
                                    isActive
                                        ? "border border-line bg-surface text-ink shadow-xs"
                                        : "text-ink-2 hover:bg-surface-2 hover:text-ink"
                                )}
                            >
                                <Icon className={cn("h-4 w-4 flex-none", isActive ? "text-brick" : "text-ink-3")} />
                                <span className="truncate">{item.label}</span>
                            </Link>
                        )
                    })}
                </nav>

                <div className="space-y-2 border-t border-line p-3">
                    <div className="rounded-md bg-surface-2 p-2">
                        <LanguageSwitcher />
                    </div>
                    <Link
                        href="/settings"
                        className={cn(
                            "flex h-9 items-center gap-3 rounded-md px-3 text-sm font-medium text-ink-2 transition hover:bg-surface-2 hover:text-ink",
                            isActiveRoute('/settings') && "border border-line bg-surface text-ink shadow-xs"
                        )}
                    >
                        <Settings className="h-4 w-4 text-ink-3" />
                        {t('settings')}
                    </Link>
                    <button
                        onClick={handleSignOut}
                        className="flex h-9 w-full items-center gap-3 rounded-md px-3 text-left text-sm font-medium text-clay transition hover:bg-clay-soft"
                    >
                        <LogOut className="h-4 w-4" />
                        {t('logout')}
                    </button>
                </div>
            </aside>
        </>
    )
}
