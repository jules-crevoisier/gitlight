'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Icon } from '@/components/ui/Icon'
import { UserProfile } from './UserProfile'

type NavItem = {
  label: string
  href: string
  icon: string
  count?: number
}

type MobileSidebarProps = {
  isOpen: boolean
  onClose: () => void
  user: { username: string; email: string } | null
  openPRCount?: number
}

const navItems: NavItem[] = [
  { label: 'Repositories', href: '/dashboard', icon: 'solar:code-square-linear' },
  { label: 'Pull Requests', href: '/dashboard/pulls', icon: 'solar:git-pull-request-linear' },
  { label: 'Team', href: '/dashboard/team', icon: 'solar:users-group-rounded-linear' },
  { label: 'Settings', href: '/dashboard/settings', icon: 'solar:settings-linear' },
]

export const MobileSidebar = ({ isOpen, onClose, user, openPRCount = 0 }: MobileSidebarProps) => {
  const pathname = usePathname()

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  useEffect(() => {
    onClose()
  }, [pathname, onClose])

  const items = navItems.map((item) => ({
    ...item,
    count: item.label === 'Pull Requests' ? openPRCount : undefined,
  }))

  if (!isOpen) return null

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm md:hidden"
        onClick={onClose}
        aria-hidden
      />
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 w-64 h-full border-r border-zinc-200 bg-white flex-col md:hidden',
          'flex justify-between shadow-xl'
        )}
        role="dialog"
        aria-label="Navigation menu"
      >
<div className="flex-1 overflow-y-auto">
        <div className="h-14 flex items-center justify-between px-5 border-b border-zinc-100">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-6 h-6 bg-zinc-900 rounded-md flex items-center justify-center text-white text-xs font-medium tracking-tighter">
              GL
            </div>
            <span className="font-medium tracking-tight text-sm text-zinc-800">GitLight</span>
          </Link>
          <button
            onClick={onClose}
            className="p-2 text-zinc-500 hover:text-zinc-900"
            aria-label="Close menu"
          >
            <Icon name="solar:close-circle-linear" size={24} />
          </button>
        </div>

        <nav className="p-3 space-y-0.5">
          {items.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== '/dashboard' && pathname.startsWith(item.href))
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-all',
                    isActive
                      ? 'text-zinc-900 bg-zinc-100 border border-zinc-200/60'
                      : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50'
                  )}
                >
                  <Icon name={item.icon} size={18} className="text-zinc-500" />
                  <span className="font-medium">{item.label}</span>
                  {typeof item.count === 'number' && item.count > 0 ? (
                    <span className="ml-auto text-[10px] bg-zinc-200 text-zinc-600 px-1.5 py-0.5 rounded-full font-medium">
                      {item.count}
                    </span>
                  ) : null}
                </Link>
              )
            })}
        </nav>
      </div>
      {user ? <UserProfile user={user} /> : null}
      </aside>
    </>
  )
}
