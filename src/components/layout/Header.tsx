'use client'

import Link from 'next/link'
import { Icon } from '@/components/ui/Icon'

type HeaderProps = {
  onMenuClick?: () => void
}

export const Header = ({ onMenuClick }: HeaderProps) => {
  return (
    <header className="h-14 border-b border-zinc-200 dark:border-zinc-700 flex items-center justify-between px-4 md:px-6 lg:px-8 bg-white dark:bg-zinc-900 shrink-0">
      <Link href="/dashboard" className="flex items-center gap-2">
        <div className="w-6 h-6 bg-zinc-900 dark:bg-zinc-100 rounded-md flex items-center justify-center text-white dark:text-zinc-900 text-xs font-medium tracking-tighter">
          GL
        </div>
        <span className="font-medium tracking-tight text-sm text-zinc-900 dark:text-zinc-100">GitLight</span>
      </Link>
      {onMenuClick ? (
        <button
          onClick={onMenuClick}
          aria-label="Open menu"
          className="p-2 md:hidden text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
        >
          <Icon name="solar:hamburger-menu-linear" size={24} />
        </button>
      ) : null}
    </header>
  )
}
