import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import { repoExists, getDefaultBranch, getCommits, getBranches } from '@/lib/git'
import { Breadcrumbs } from '@/components/layout/Breadcrumbs'
import { RepoTabs } from '@/components/repo/RepoTabs'
import { CommitList } from '@/components/commits/CommitList'
import { BranchSelector } from '@/components/repo/BranchSelector'

type CommitsPageProps = {
  params: Promise<{
    owner: string
    repo: string
  }>
  searchParams: Promise<{
    ref?: string
  }>
}

const CommitsPage = async ({ params, searchParams }: CommitsPageProps) => {
  const { owner, repo } = await params
  const { ref: branchParam } = await searchParams

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

  const defaultBranch = await getDefaultBranch(owner, repo)
  const currentBranch = branchParam || defaultBranch
  const commits = await getCommits(owner, repo, currentBranch, 50)

  return (
    <>
      <Breadcrumbs
        items={[
          { label: owner, href: '/dashboard' },
          { label: repo, href: `/${owner}/${repo}` },
          { label: 'Commits' },
        ]}
        isPublic={repository.isPublic}
      />

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
          <RepoTabs
            owner={owner}
            repo={repo}
            activeTab="commits"
            prCount={repository._count.pullRequests}
            currentBranch={currentBranch}
            defaultBranch={defaultBranch}
          />

          {/* Branch Selector */}
          <div className="flex items-center gap-4 mb-6 mt-6">
            <BranchSelector 
              owner={owner} 
              repo={repo} 
              currentBranch={currentBranch}
              defaultBranch={defaultBranch}
            />
            <span className="text-sm text-zinc-500">
              {commits.length} commits
            </span>
          </div>

          {/* Commits List */}
          <CommitList
            commits={commits}
            owner={owner}
            repo={repo}
          />
        </div>
      </div>
    </>
  )
}

export default CommitsPage
