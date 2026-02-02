import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import Link from 'next/link'
import { Icon } from '@/components/ui/Icon'
import { Badge } from '@/components/ui/Badge'
import { formatRelativeTime } from '@/lib/utils'

const PullsPage = async () => {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  // Get all open PRs for repos the user has access to
  const pullRequests = await prisma.pullRequest.findMany({
    where: {
      status: 'OPEN',
      repo: {
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
    },
    include: {
      author: {
        select: { username: true },
      },
      repo: {
        include: {
          owner: {
            select: { username: true },
          },
        },
      },
      _count: {
        select: { comments: true },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  return (
    <>
      {/* Header */}
      <div className="h-14 border-b border-zinc-200 flex items-center justify-between px-6 lg:px-8 bg-white shrink-0">
        <h1 className="text-lg font-medium text-zinc-900">Pull Requests</h1>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-6 lg:px-8 py-8">
          {pullRequests.length === 0 ? (
            <div className="text-center py-12 border border-zinc-200 rounded-lg bg-zinc-50/50">
              <Icon name="solar:git-pull-request-linear" size={48} className="text-zinc-300 mx-auto mb-4" />
              <h3 className="text-sm font-medium text-zinc-900 mb-1">No open pull requests</h3>
              <p className="text-sm text-zinc-500">
                Pull requests from your repositories will appear here.
              </p>
            </div>
          ) : (
            <div className="border border-zinc-200 rounded-lg overflow-hidden divide-y divide-zinc-100">
              {pullRequests.map((pr) => (
                <Link
                  key={pr.id}
                  href={`/${pr.repo.owner.username}/${pr.repo.name}/pulls/${pr.number}`}
                  className="group flex items-center justify-between px-4 py-4 hover:bg-zinc-50 transition-colors"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <Icon
                      name="solar:git-pull-request-linear"
                      size={20}
                      className="text-emerald-500 mt-0.5"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-zinc-900 group-hover:text-blue-600 transition-colors">
                          {pr.title}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        {pr.repo.owner.username}/{pr.repo.name} #{pr.number} opened{' '}
                        {formatRelativeTime(pr.createdAt)} by {pr.author.username}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-mono bg-zinc-100 text-zinc-600 px-1.5 py-0.5 rounded">
                          {pr.sourceBranch}
                        </span>
                        <Icon name="solar:arrow-right-linear" size={10} className="text-zinc-400" />
                        <span className="text-[10px] font-mono bg-zinc-100 text-zinc-600 px-1.5 py-0.5 rounded">
                          {pr.targetBranch}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    {pr._count.comments > 0 ? (
                      <span className="flex items-center gap-1 text-xs text-zinc-400">
                        <Icon name="solar:chat-line-linear" size={14} />
                        {pr._count.comments}
                      </span>
                    ) : null}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default PullsPage
