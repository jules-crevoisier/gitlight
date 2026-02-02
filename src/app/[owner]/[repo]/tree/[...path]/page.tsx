import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import { repoExists, getDefaultBranch, getTree, getCommits } from '@/lib/git'
import { Breadcrumbs } from '@/components/layout/Breadcrumbs'
import { RepoTabs } from '@/components/repo/RepoTabs'
import { FileBrowser } from '@/components/repo/FileBrowser'
import { BranchSelector } from '@/components/repo/BranchSelector'
import { RepoSearch } from '@/components/repo/RepoSearch'
import { Icon } from '@/components/ui/Icon'
import { formatRelativeTime } from '@/lib/utils'

type TreePageProps = {
  params: Promise<{
    owner: string
    repo: string
    path: string[]
  }>
}

const TreePage = async ({ params }: TreePageProps) => {
  const { owner, repo, path: pathSegments } = await params
  const branch = pathSegments[0]
  const treePath = pathSegments.slice(1).join('/')

  const repository = await prisma.repository.findFirst({
    where: {
      name: repo,
      owner: { username: owner },
    },
    include: {
      owner: { select: { username: true } },
      _count: {
        select: {
          pullRequests: { where: { status: 'OPEN' } },
        },
      },
    },
  })

  if (!repository || !repoExists(owner, repo)) {
    notFound()
  }

  const [tree, commits, defaultBranch] = await Promise.all([
    getTree(owner, repo, branch, treePath),
    getCommits(owner, repo, branch, 1),
    getDefaultBranch(owner, repo),
  ])
  const lastCommit = commits[0] || null

  // Build breadcrumb items
  const pathParts = treePath.split('/').filter(Boolean)
  const breadcrumbItems = [
    { label: owner, href: '/dashboard' },
    { label: repo, href: `/${owner}/${repo}` },
    ...pathParts.map((part, index) => ({
      label: part,
      href:
        index === pathParts.length - 1
          ? undefined
          : `/${owner}/${repo}/tree/${branch}/${pathParts.slice(0, index + 1).join('/')}`,
    })),
  ]

  return (
    <>
      <Breadcrumbs items={breadcrumbItems} isPublic={repository.isPublic} />

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
          <RepoTabs
            owner={owner}
            repo={repo}
            activeTab="code"
            prCount={repository._count.pullRequests}
            currentBranch={branch}
            defaultBranch={defaultBranch}
          />

          {/* Control Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 mt-6">
            <div className="flex items-center gap-3">
              <BranchSelector
                owner={owner}
                repo={repo}
                currentBranch={branch}
                defaultBranch={defaultBranch}
                basePath={treePath}
              />
              <div className="h-4 w-px bg-zinc-200" />
              {lastCommit ? (
                <div className="flex items-center gap-1 text-sm text-zinc-500">
                  <Icon name="solar:clock-circle-linear" size={14} />
                  <span className="text-xs">
                    Last commit{' '}
                    <span className="text-zinc-900 font-medium">
                      {formatRelativeTime(lastCommit.date)}
                    </span>
                  </span>
                </div>
              ) : null}
            </div>

            <RepoSearch owner={owner} repo={repo} branch={branch} className="w-full sm:w-64" />
          </div>

          <FileBrowser
            owner={owner}
            repo={repo}
            branch={branch}
            path={treePath}
            tree={tree}
            lastCommit={lastCommit}
          />
        </div>
      </div>
    </>
  )
}

export default TreePage
