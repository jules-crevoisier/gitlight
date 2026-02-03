'use client'

import { useState } from 'react'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { MobileSidebar } from './MobileSidebar'

type DashboardShellProps = {
  user: { username: string; email: string } | null
  openPRCount: number
  children: React.ReactNode
}

export const DashboardShell = ({ user, openPRCount, children }: DashboardShellProps) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar user={user} openPRCount={openPRCount} />
      <MobileSidebar
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        user={user}
        openPRCount={openPRCount}
      />
      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-white dark:bg-zinc-900">
        <Header onMenuClick={() => setMobileMenuOpen(true)} />
        {children}
      </main>
    </div>
  )
}
