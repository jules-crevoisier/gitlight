import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import { Breadcrumbs } from '@/components/layout/Breadcrumbs'
import { RepoTabs } from '@/components/repo/RepoTabs'
import { PullRequestList } from '@/components/pulls/PullRequestList'
import { CreatePRButton } from '@/components/pulls/CreatePRButton'
import { Icon } from '@/components/ui/Icon'
import { cn } from '@/lib/utils'

type PullsPageProps = {
  params: Promise<{
    owner: string
    repo: string
  }>
  searchParams: Promise<{
    status?: string
  }>
}

const PullsPage = async ({ params, searchParams }: PullsPageProps) => {
  const { owner, repo } = await params
  const { status = 'open' } = await searchParams

  const repository = await prisma.repository.findFirst({
    where: {
      name: repo,
      owner: { username: owner },
    },
    include: {
      owner: { select: { username: true } },
    },
  })

  if (!repository) {
    notFound()
  }

  const pullRequests = await prisma.pullRequest.findMany({
    where: {
      repoId: repository.id,
      status: status === 'open' ? 'OPEN' : status === 'closed' ? 'CLOSED' : 'MERGED',
    },
    include: {
      author: {
        select: {
          username: true,
        },
      },
      _count: {
        select: {
          comments: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  const counts = await prisma.pullRequest.groupBy({
    by: ['status'],
    where: { repoId: repository.id },
    _count: true,
  })

  const openCount = counts.find((c) => c.status === 'OPEN')?._count || 0
  const closedCount = counts.find((c) => c.status === 'CLOSED')?._count || 0
  const mergedCount = counts.find((c) => c.status === 'MERGED')?._count || 0

  return (
    <>
      <Breadcrumbs
        items={[
          { label: owner, href: '/dashboard' },
          { label: repo, href: `/${owner}/${repo}` },
          { label: 'Pull Requests' },
        ]}
        isPublic={repository.isPublic}
        actions={<CreatePRButton owner={owner} repo={repo} />}
      />

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
          <RepoTabs
            owner={owner}
            repo={repo}
            activeTab="pulls"
            prCount={openCount}
          />

          {/* Filters */}
          <div className="flex items-center gap-2 mb-6 mt-6">
            <a
              href={`/${owner}/${repo}/pulls?status=open`}
              className={cn(
                'inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-all',
                status === 'open'
                  ? 'bg-zinc-900 text-white'
                  : 'bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-50'
              )}
            >
              <Icon name="solar:git-pull-request-linear" size={14} />
              Open ({openCount})
            </a>
            <a
              href={`/${owner}/${repo}/pulls?status=merged`}
              className={cn(
                'inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-all',
                status === 'merged'
                  ? 'bg-zinc-900 text-white'
                  : 'bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-50'
              )}
            >
              <Icon name="solar:check-circle-linear" size={14} />
              Merged ({mergedCount})
            </a>
            <a
              href={`/${owner}/${repo}/pulls?status=closed`}
              className={cn(
                'inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-all',
                status === 'closed'
                  ? 'bg-zinc-900 text-white'
                  : 'bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-50'
              )}
            >
              <Icon name="solar:close-circle-linear" size={14} />
              Closed ({closedCount})
            </a>
          </div>

          <PullRequestList
            pullRequests={pullRequests}
            owner={owner}
            repo={repo}
          />
        </div>
      </div>
    </>
  )
}

export default PullsPage
