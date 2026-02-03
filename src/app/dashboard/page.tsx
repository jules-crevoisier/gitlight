import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { RepositoryListWithSearch } from '@/components/repo/RepositoryListWithSearch'
import { CreateRepoButton } from '@/components/repo/CreateRepoButton'

const DashboardPage = async () => {
  const session = await auth()
  
  if (!session?.user) {
    return null
  }

  const repositories = await prisma.repository.findMany({
    where: {
      OR: [
        { ownerId: session.user.id },
        {
          permissions: {
            some: {
              userId: session.user.id,
            },
          },
        },
      ],
    },
    include: {
      owner: {
        select: {
          username: true,
        },
      },
      _count: {
        select: {
          pullRequests: {
            where: { status: 'OPEN' },
          },
        },
      },
    },
    orderBy: {
      updatedAt: 'desc',
    },
  })

  return (
    <>
      {/* Header */}
      <div className="h-14 border-b border-zinc-200 dark:border-zinc-700 flex items-center justify-between px-6 lg:px-8 bg-white dark:bg-zinc-900 shrink-0">
        <h1 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">Repositories</h1>
        <CreateRepoButton />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-6 lg:px-8 py-8">
          <RepositoryListWithSearch repositories={repositories} currentUserId={session.user.id} />
        </div>
      </div>
    </>
  )
}

export default DashboardPage
