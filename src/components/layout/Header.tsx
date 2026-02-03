'use client'

import Link from 'next/link'
import { Icon } from '@/components/ui/Icon'

type HeaderProps = {
  onMenuClick?: () => void
}

export const Header = ({ onMenuClick }: HeaderProps) => {
  return (
    <header className="h-14 border-b border-border flex items-center justify-between px-4 md:px-6 lg:px-8 bg-background shrink-0">
      <Link href="/dashboard" className="flex items-center gap-2">
        <div className="w-6 h-6 bg-foreground rounded-md flex items-center justify-center text-background text-xs font-medium tracking-tighter">
          GL
        </div>
        <span className="font-medium tracking-tight text-sm text-foreground">GitLight</span>
      </Link>
      {onMenuClick ? (
        <button
          onClick={onMenuClick}
          aria-label="Open menu"
          className="p-2 md:hidden text-foreground-muted hover:text-foreground"
        >
          <Icon name="solar:hamburger-menu-linear" size={24} />
        </button>
      ) : null}
    </header>
  )
}
