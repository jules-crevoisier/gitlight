'use client'

import { Avatar } from '@/components/ui/Avatar'
import { Icon } from '@/components/ui/Icon'
import { ThemeToggle } from '@/components/ui/ThemeToggle'

type UserProfileProps = {
  user: {
    username: string
    email: string
  }
}

export const UserProfile = ({ user }: UserProfileProps) => {
  const handleLogout = async () => {
    const { signOut } = await import('next-auth/react')
    await signOut({ callbackUrl: '/login' })
  }

  return (
    <div className="p-4 border-t border-border">
      <div className="flex items-center gap-2 mb-3">
        <ThemeToggle />
        <span className="text-[10px] text-foreground-muted">Theme</span>
      </div>
      <div className="flex items-center gap-3">
        <Avatar name={user.username} size="md" />
        <div className="flex flex-col min-w-0 flex-1">
          <span className="text-xs font-medium text-foreground truncate">{user.username}</span>
          <span className="text-[10px] text-foreground-muted">Free Plan</span>
        </div>
        <button
          onClick={handleLogout}
          className="text-foreground-muted hover:text-foreground transition-colors"
          aria-label="Logout"
        >
          <Icon name="solar:logout-2-linear" size={16} />
        </button>
      </div>
    </div>
  )
}
