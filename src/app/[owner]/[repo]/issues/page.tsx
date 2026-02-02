import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import { Breadcrumbs } from '@/components/layout/Breadcrumbs'
import { RepoTabs } from '@/components/repo/RepoTabs'
import { Icon } from '@/components/ui/Icon'

type IssuesPageProps = {
  params: Promise<{
    owner: string
    repo: string
  }>
}

const IssuesPage = async ({ params }: IssuesPageProps) => {
  const { owner, repo } = await params

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

  return (
    <>
      <Breadcrumbs
        items={[
          { label: owner, href: '/dashboard' },
          { label: repo, href: `/${owner}/${repo}` },
          { label: 'Issues' },
        ]}
        isPublic={repository.isPublic}
      />

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
          <RepoTabs owner={owner} repo={repo} activeTab="issues" />

          {/* Coming Soon */}
          <div className="mt-8 flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mb-4">
              <Icon name="solar:chat-round-dots-linear" size={28} className="text-zinc-400" />
            </div>
            <h2 className="text-lg font-medium text-zinc-900 mb-2">Issues coming soon</h2>
            <p className="text-sm text-zinc-500 max-w-md">
              Issue tracking will be available in a future update.
              For now, use Pull Requests to discuss changes.
            </p>
          </div>
        </div>
      </div>
    </>
  )
}

export default IssuesPage
