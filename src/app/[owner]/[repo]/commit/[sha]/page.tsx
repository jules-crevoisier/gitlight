import { Metadata } from 'next'
import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import { repoExists, getCommit, getCommitDiff } from '@/lib/git'
import { Breadcrumbs } from '@/components/layout/Breadcrumbs'
import { RepoTabs } from '@/components/repo/RepoTabs'
import { DiffViewer } from '@/components/repo/DiffViewer'
import { Avatar } from '@/components/ui/Avatar'
import { truncateHash, formatRelativeTime } from '@/lib/utils'

type CommitPageProps = {
  params: Promise<{ owner: string; repo: string; sha: string }>
}

export async function generateMetadata({ params }: CommitPageProps): Promise<Metadata> {
  const { owner, repo, sha } = await params
  const commit = await getCommit(owner, repo, sha)
  if (!commit) return { title: 'Commit' }
  return {
    title: `${commit.message.split('\n')[0]} - ${owner}/${repo} - GitLight`,
    description: `Commit ${truncateHash(sha)} by ${commit.author.name}`,
  }
}

const CommitPage = async ({ params }: CommitPageProps) => {
  const { owner, repo, sha } = await params

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

  const commit = await getCommit(owner, repo, sha)
  
  if (!commit) {
    notFound()
  }

  // Get diff for this commit
  const diff = await getCommitDiff(owner, repo, sha)

  return (
    <>
      <Breadcrumbs
        items={[
          { label: owner, href: '/dashboard' },
          { label: repo, href: `/${owner}/${repo}` },
          { label: 'Commits', href: `/${owner}/${repo}/commits` },
          { label: truncateHash(sha) },
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
          />

          {/* Commit Info */}
          <div className="mt-6 border border-zinc-200 rounded-lg bg-white shadow-sm overflow-hidden">
            <div className="p-6">
              <h1 className="text-lg font-medium text-zinc-900 mb-4">
                {commit.message}
              </h1>
              
              <div className="flex items-center gap-4 text-sm text-zinc-500">
                <div className="flex items-center gap-2">
                  <Avatar name={commit.author.name} size="sm" />
                  <span className="font-medium text-zinc-700">{commit.author.name}</span>
                  <span>committed {formatRelativeTime(commit.date)}</span>
                </div>
              </div>
            </div>

            <div className="border-t border-zinc-100 px-6 py-3 bg-zinc-50 flex items-center justify-between">
              <div className="flex items-center gap-4 text-xs text-zinc-500">
                <span className="font-mono bg-white px-2 py-1 rounded border border-zinc-200">
                  {commit.hash}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-emerald-600">
                  +{diff.reduce((acc, f) => acc + f.additions, 0)}
                </span>
                <span className="text-red-600">
                  -{diff.reduce((acc, f) => acc + f.deletions, 0)}
                </span>
              </div>
            </div>
          </div>

          {/* Files Changed */}
          <div className="mt-6">
            <h2 className="text-sm font-medium text-zinc-700 mb-4">
              {diff.length} files changed
            </h2>
            
            <DiffViewer files={diff} owner={owner} repo={repo} sha={sha} />
          </div>
        </div>
      </div>
    </>
  )
}

export default CommitPage
