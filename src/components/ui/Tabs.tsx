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
    <div className={cn('flex items-center gap-6 border-b border-zinc-200 dark:border-zinc-700', className)}>
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab

        return (
          <Link
            key={tab.id}
            href={tab.href}
            className={cn(
              'pb-3 text-sm font-medium flex items-center gap-2 transition-colors -mb-px',
              isActive
                ? 'text-zinc-900 dark:text-zinc-100 border-b-2 border-zinc-900 dark:border-zinc-100'
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-100'
            )}
          >
            {tab.icon}
            {tab.label}
            {typeof tab.count === 'number' ? (
              <span className="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 px-1.5 py-0.5 rounded-full text-[10px]">
                {tab.count}
              </span>
            ) : null}
          </Link>
        )
      })}
    </div>
  )
}
