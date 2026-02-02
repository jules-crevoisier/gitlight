import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { DashboardShell } from '@/components/layout/DashboardShell'

type DashboardLayoutProps = {
  children: React.ReactNode
}

const DashboardLayout = async ({ children }: DashboardLayoutProps) => {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  const user = {
    username: session.user.username,
    email: session.user.email,
  }

  const openPRCount = await prisma.pullRequest.count({
    where: {
      status: 'OPEN',
      repo: {
        OR: [
          { ownerId: session.user.id },
          { permissions: { some: { userId: session.user.id } } },
        ],
      },
    },
  })

  return (
    <DashboardShell user={user} openPRCount={openPRCount}>
      {children}
    </DashboardShell>
  )
}

export default DashboardLayout
