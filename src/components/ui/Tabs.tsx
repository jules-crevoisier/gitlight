'use client'

import { cn } from '@/lib/utils'
import Link from 'next/link'

type Tab = {
  id: string
  label: string
  href: string
  icon?: React.ReactNode
  count?: number
}

type TabsProps = {
  tabs: Tab[]
  activeTab: string
  className?: string
}

export const Tabs = ({ tabs, activeTab, className }: TabsProps) => {
  return (
    <div className={cn('flex items-center gap-6 border-b border-border', className)}>
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab

        return (
          <Link
            key={tab.id}
            href={tab.href}
            className={cn(
              'pb-3 text-sm font-medium flex items-center gap-2 transition-colors -mb-px',
              isActive
                ? 'text-foreground border-b-2 border-foreground'
                : 'text-foreground-muted hover:text-foreground'
            )}
          >
            {tab.icon}
            {tab.label}
            {typeof tab.count === 'number' ? (
              <span className="bg-background-muted text-foreground-muted px-1.5 py-0.5 rounded-full text-[10px]">
                {tab.count}
              </span>
            ) : null}
          </Link>
        )
      })}
    </div>
  )
}
