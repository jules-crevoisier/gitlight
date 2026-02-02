import { Metadata } from 'next'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import { getDiff } from '@/lib/git'
import { Breadcrumbs } from '@/components/layout/Breadcrumbs'
import { RepoTabs } from '@/components/repo/RepoTabs'
import { DiffViewer } from '@/components/repo/DiffViewer'
import { CommentSection } from '@/components/pulls/CommentSection'
import { PRActions } from '@/components/pulls/PRActions'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Icon } from '@/components/ui/Icon'
import { formatRelativeTime } from '@/lib/utils'

type PRDetailPageProps = {
  params: Promise<{ owner: string; repo: string; id: string }>
}

export async function generateMetadata({ params }: PRDetailPageProps): Promise<Metadata> {
  const { owner, repo, id } = await params
  const prNumber = parseInt(id)
  const pr = await prisma.pullRequest.findFirst({
    where: {
      repo: { name: repo, owner: { username: owner } },
      number: prNumber,
    },
  })
  if (!pr) return { title: 'Pull Request' }
  return {
    title: `${pr.title} #${pr.number} - ${owner}/${repo} - GitLight`,
    description: pr.description || `Pull request #${pr.number}`,
  }
}

const PRDetailPage = async ({ params }: PRDetailPageProps) => {
  const { owner, repo, id } = await params
  const prNumber = parseInt(id)
  const session = await auth()

  const repository = await prisma.repository.findFirst({
    where: {
      name: repo,
      owner: { username: owner },
    },
    include: {
      owner: { select: { id: true, username: true } },
    },
  })

  if (!repository) {
    notFound()
  }

  const pullRequest = await prisma.pullRequest.findFirst({
    where: {
      repoId: repository.id,
      number: prNumber,
    },
    include: {
      author: {
        select: {
          id: true,
          username: true,
        },
      },
      comments: {
        include: {
          author: {
            select: {
              username: true,
            },
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
      },
    },
  })

  if (!pullRequest) {
    notFound()
  }

  // Get diff
  const diff = await getDiff(
    owner,
    repo,
    pullRequest.targetBranch,
    pullRequest.sourceBranch
  ).catch(() => [])

  const openPRCount = await prisma.pullRequest.count({
    where: { repoId: repository.id, status: 'OPEN' },
  })

  const canMerge =
    session?.user &&
    (session.user.id === repository.ownerId || session.user.id === pullRequest.authorId)

  return (
    <>
      <Breadcrumbs
        items={[
          { label: owner, href: '/dashboard' },
          { label: repo, href: `/${owner}/${repo}` },
          { label: 'Pull Requests', href: `/${owner}/${repo}/pulls` },
          { label: `#${pullRequest.number}` },
        ]}
        isPublic={repository.isPublic}
      />

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
          <RepoTabs owner={owner} repo={repo} activeTab="pulls" prCount={openPRCount} />

          {/* PR Header */}
          <div className="mt-6 mb-8">
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <h1 className="text-2xl font-medium text-zinc-900 mb-2">
                  {pullRequest.title}
                  <span className="text-zinc-400 font-normal ml-2">#{pullRequest.number}</span>
                </h1>
                <div className="flex items-center gap-3 text-sm">
                  <Badge
                    variant={
                      pullRequest.status === 'OPEN'
                        ? 'success'
                        : pullRequest.status === 'MERGED'
                        ? 'info'
                        : 'default'
                    }
                  >
                    {pullRequest.status.toLowerCase()}
                  </Badge>
                  <span className="text-zinc-500">
                    <span className="font-medium text-zinc-700">{pullRequest.author.username}</span>
                    {' wants to merge '}
                    <span className="font-mono text-xs bg-zinc-100 px-1.5 py-0.5 rounded">
                      {pullRequest.sourceBranch}
                    </span>
                    {' into '}
                    <span className="font-mono text-xs bg-zinc-100 px-1.5 py-0.5 rounded">
                      {pullRequest.targetBranch}
                    </span>
                  </span>
                </div>
              </div>

              {canMerge && pullRequest.status === 'OPEN' ? (
                <PRActions
                  owner={owner}
                  repo={repo}
                  prNumber={pullRequest.number}
                />
              ) : null}
            </div>

            {pullRequest.description ? (
              <div className="mt-6 p-4 border border-zinc-200 rounded-lg bg-zinc-50/50">
                <p className="text-sm text-zinc-600 whitespace-pre-wrap">
                  {pullRequest.description}
                </p>
              </div>
            ) : null}
          </div>

          {/* Files Changed */}
          <div className="mb-8">
            <h2 className="text-sm font-medium text-zinc-700 mb-4 flex items-center gap-2">
              <Icon name="solar:file-linear" size={16} />
              {diff.length} files changed
              <span className="text-emerald-600">
                +{diff.reduce((acc, f) => acc + f.additions, 0)}
              </span>
              <span className="text-red-600">
                -{diff.reduce((acc, f) => acc + f.deletions, 0)}
              </span>
            </h2>
            
            {pullRequest.status === 'MERGED' && diff.length === 0 ? (
              <div className="border border-zinc-200 rounded-lg p-6 bg-zinc-50/50 text-center">
                <Icon name="solar:check-circle-bold" size={32} className="text-emerald-500 mx-auto mb-3" />
                <p className="text-sm text-zinc-600">
                  This pull request was successfully merged.
                </p>
                <p className="text-xs text-zinc-400 mt-1">
                  The branches are now identical - no diff to display.
                </p>
              </div>
            ) : (
              <DiffViewer 
                files={diff} 
                owner={owner}
                repo={repo}
                base={pullRequest.targetBranch}
                head={pullRequest.sourceBranch}
              />
            )}
          </div>

          {/* Comments */}
          <CommentSection
            comments={pullRequest.comments}
            prId={pullRequest.id}
            owner={owner}
            repo={repo}
            prNumber={pullRequest.number}
            isLoggedIn={!!session?.user}
          />
        </div>
      </div>
    </>
  )
}

export default PRDetailPage
