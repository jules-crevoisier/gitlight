import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import { repoExists, getDefaultBranch, getTree, getCommits, getFileContent, getRepoStats } from '@/lib/git'
import { Breadcrumbs } from '@/components/layout/Breadcrumbs'
import { RepoTabs } from '@/components/repo/RepoTabs'
import { FileBrowser } from '@/components/repo/FileBrowser'
import { BranchSelector } from '@/components/repo/BranchSelector'
import { ReadmePreview } from '@/components/repo/ReadmePreview'
import { RepoActions } from '@/components/repo/RepoActions'
import { RepoSearch } from '@/components/repo/RepoSearch'
import { Icon } from '@/components/ui/Icon'
import { formatRelativeTime } from '@/lib/utils'

type RepoPageProps = {
  params: Promise<{
    owner: string
    repo: string
  }>
  searchParams: Promise<{
    ref?: string
  }>
}

export const revalidate = 60

const RepoPage = async ({ params, searchParams }: RepoPageProps) => {
  const { owner, repo } = await params
  const { ref } = await searchParams

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

  if (!repository) {
    notFound()
  }

  const hasGitRepo = repoExists(owner, repo)
  
  let defaultBranch = 'main'
  let currentBranch = 'main'
  let tree: Awaited<ReturnType<typeof getTree>> = []
  let lastCommit: Awaited<ReturnType<typeof getCommits>>[0] | null = null
  let readme: string | null = null
  let stats = { commits: 0, branches: 0, tags: 0, contributors: 0 }

  if (hasGitRepo) {
    defaultBranch = await getDefaultBranch(owner, repo)
    currentBranch = ref || defaultBranch
    
    const [treeResult, commitsResult, statsResult] = await Promise.all([
      getTree(owner, repo, currentBranch, ''),
      getCommits(owner, repo, currentBranch, 1),
      getRepoStats(owner, repo),
    ])
    
    tree = treeResult
    lastCommit = commitsResult[0] || null
    stats = statsResult

    // Try to get README
    const readmeFile = tree.find(
      (f) => f.type === 'blob' && f.name.toLowerCase().match(/^readme\.?(md|txt)?$/)
    )
    if (readmeFile) {
      const content = await getFileContent(owner, repo, currentBranch, readmeFile.name)
      if (content && !content.isBinary) {
        readme = content.content
      }
    }
  }

  return (
    <>
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: owner, href: `/dashboard` },
          { label: repo },
        ]}
        isPublic={repository.isPublic}
        actions={<RepoActions owner={owner} repo={repo} />}
      />

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
          {/* Repo Info */}
          <div className="mb-8">
            <h1 className="text-2xl font-medium tracking-tight text-zinc-900 mb-2">
              {repository.name.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
            </h1>
            {repository.description ? (
              <p className="text-sm text-zinc-500 max-w-2xl mb-4">{repository.description}</p>
            ) : null}
            
            {/* Stats */}
            {hasGitRepo && stats.commits > 0 ? (
              <div className="flex items-center gap-4 text-sm text-zinc-500">
                <span className="flex items-center gap-1.5">
                  <Icon name="solar:git-commit-linear" size={14} />
                  {stats.commits} commits
                </span>
                <span className="flex items-center gap-1.5">
                  <Icon name="solar:branch-linear" size={14} />
                  {stats.branches} branches
                </span>
                <span className="flex items-center gap-1.5">
                  <Icon name="solar:tag-linear" size={14} />
                  {stats.tags} tags
                </span>
                <span className="flex items-center gap-1.5">
                  <Icon name="solar:users-group-rounded-linear" size={14} />
                  {stats.contributors} contributors
                </span>
              </div>
            ) : null}
          </div>

          {/* Tabs */}
          <RepoTabs
            owner={owner}
            repo={repo}
            activeTab="code"
            prCount={repository._count.pullRequests}
            currentBranch={currentBranch}
            defaultBranch={defaultBranch}
          />

          {hasGitRepo && tree.length > 0 ? (
            <>
              {/* Control Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 mt-6">
                <div className="flex items-center gap-3">
                  <BranchSelector
                    owner={owner}
                    repo={repo}
                    currentBranch={currentBranch}
                    defaultBranch={defaultBranch}
                  />
                  <div className="h-4 w-px bg-zinc-200" />
                  {lastCommit ? (
                    <div className="flex items-center gap-1 text-sm text-zinc-500">
                      <Icon name="solar:clock-circle-linear" size={14} />
                      <span className="text-xs">
                        Last commit{' '}
                        <span className="text-zinc-900 font-medium">
                          {formatRelativeTime(lastCommit.date)}
                        </span>{' '}
                        by{' '}
                        <a href="#" className="hover:underline">
                          {lastCommit.author.name}
                        </a>
                      </span>
                    </div>
                  ) : null}
                </div>

                <RepoSearch owner={owner} repo={repo} branch={currentBranch} className="w-full sm:w-64" />
              </div>

              {/* File Browser */}
              <FileBrowser
                owner={owner}
                repo={repo}
                branch={currentBranch}
                path=""
                tree={tree}
                lastCommit={lastCommit}
              />

              {/* README Preview */}
              {readme ? (
                <ReadmePreview content={readme} className="mt-8" />
              ) : null}
            </>
          ) : (
            <div className="mt-6 border border-zinc-200 rounded-lg p-8 text-center bg-zinc-50/50">
              <Icon name="solar:code-square-linear" size={48} className="text-zinc-300 mx-auto mb-4" />
              <h3 className="text-sm font-medium text-zinc-900 mb-2">
                This repository is empty
              </h3>
              <p className="text-sm text-zinc-500 max-w-md mx-auto mb-6">
                Get started by pushing code to this repository or creating a new file.
              </p>
              <div className="bg-zinc-900 rounded-md p-4 text-left max-w-lg mx-auto">
                <p className="text-zinc-400 text-xs font-mono mb-2"># Clone and push</p>
                <p className="text-zinc-100 text-xs font-mono mb-1">
                  git clone gitlight.dev/{owner}/{repo}.git
                </p>
                <p className="text-zinc-100 text-xs font-mono mb-1">cd {repo}</p>
                <p className="text-zinc-100 text-xs font-mono mb-1">
                  echo &quot;# {repo}&quot; &gt;&gt; README.md
                </p>
                <p className="text-zinc-100 text-xs font-mono mb-1">git add README.md</p>
                <p className="text-zinc-100 text-xs font-mono mb-1">
                  git commit -m &quot;Initial commit&quot;
                </p>
                <p className="text-zinc-100 text-xs font-mono">git push -u origin main</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default RepoPage
