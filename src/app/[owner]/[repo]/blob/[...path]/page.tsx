import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import { repoExists, getFileContent, getLastCommitForPath, getDefaultBranch } from '@/lib/git'
import { Breadcrumbs } from '@/components/layout/Breadcrumbs'
import { RepoTabs } from '@/components/repo/RepoTabs'
import { CodeViewer } from '@/components/repo/CodeViewer'
import { BranchSelector } from '@/components/repo/BranchSelector'
import { FileActions } from '@/components/repo/FileActions'
import { formatBytes } from '@/lib/utils'

type BlobPageProps = {
  params: Promise<{
    owner: string
    repo: string
    path: string[]
  }>
}

const BlobPage = async ({ params }: BlobPageProps) => {
  const { owner, repo, path: pathSegments } = await params
  const branch = pathSegments[0]
  const filePath = pathSegments.slice(1).join('/')
  const fileName = pathSegments[pathSegments.length - 1]

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

  const [content, lastCommit, defaultBranch] = await Promise.all([
    getFileContent(owner, repo, branch, filePath),
    getLastCommitForPath(owner, repo, branch, filePath),
    getDefaultBranch(owner, repo),
  ])
  
  if (!content) {
    notFound()
  }

  // Build breadcrumb items
  const pathParts = filePath.split('/').filter(Boolean)
  const breadcrumbItems = [
    { label: owner, href: '/dashboard' },
    { label: repo, href: `/${owner}/${repo}` },
    ...pathParts.slice(0, -1).map((part, index) => ({
      label: part,
      href: `/${owner}/${repo}/tree/${branch}/${pathParts.slice(0, index + 1).join('/')}`,
    })),
    { label: fileName },
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

          {/* File Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 mt-6">
            <div className="flex items-center gap-3">
              <BranchSelector 
                owner={owner} 
                repo={repo} 
                currentBranch={branch}
                defaultBranch={defaultBranch}
                basePath={filePath}
              />
              <div className="h-4 w-px bg-zinc-200" />
              <span className="text-sm text-zinc-500">
                {formatBytes(content.size)} · {content.content.split('\n').length} lines
              </span>
            </div>

            <FileActions
              owner={owner}
              repo={repo}
              branch={branch}
              filePath={filePath}
              content={content.isBinary ? '' : content.content}
            />
          </div>

          <CodeViewer
            filename={fileName}
            content={content.content}
            isBinary={content.isBinary}
            lastCommit={lastCommit}
          />
        </div>
      </div>
    </>
  )
}

export default BlobPage
