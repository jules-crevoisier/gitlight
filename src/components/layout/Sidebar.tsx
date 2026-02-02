'use client'

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

type SidebarProps = {
  user: {
    username: string
    email: string
  } | null
  openPRCount?: number
}

const navItems: NavItem[] = [
  { label: 'Repositories', href: '/dashboard', icon: 'solar:code-square-linear' },
  { label: 'Pull Requests', href: '/dashboard/pulls', icon: 'solar:git-pull-request-linear' },
  { label: 'Team', href: '/dashboard/team', icon: 'solar:users-group-rounded-linear' },
  { label: 'Settings', href: '/dashboard/settings', icon: 'solar:settings-linear' },
]

export const Sidebar = ({ user, openPRCount = 0 }: SidebarProps) => {
  const pathname = usePathname()

  const items = navItems.map((item) => ({
    ...item,
    count: item.label === 'Pull Requests' ? openPRCount : undefined,
  }))

  return (
    <aside className="w-64 border-r border-zinc-200 bg-zinc-50/50 flex-col hidden md:flex justify-between">
      <div>
        {/* Logo */}
        <div className="h-14 flex items-center px-5 border-b border-zinc-100">
          <Link href="/dashboard" className="flex items-center gap-2 group cursor-pointer">
            <div className="w-6 h-6 bg-zinc-900 rounded-md flex items-center justify-center text-white text-xs font-medium tracking-tighter">
              GL
            </div>
            <span className="font-medium tracking-tight text-sm text-zinc-800">GitLight</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="p-3 space-y-0.5">
          {items.map((item) => {
            const isActive = pathname === item.href || 
              (item.href !== '/dashboard' && pathname.startsWith(item.href))

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-all group',
                  isActive
                    ? 'text-zinc-900 bg-white shadow-sm border border-zinc-200/60'
                    : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100'
                )}
              >
                <Icon
                  name={item.icon}
                  size={18}
                  className={cn(
                    isActive ? 'text-zinc-900' : 'text-zinc-400 group-hover:text-zinc-900'
                  )}
                />
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

      {/* User Profile */}
      {user ? <UserProfile user={user} /> : null}
    </aside>
  )
}
