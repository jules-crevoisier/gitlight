import Link from 'next/link'
import { Avatar } from '@/components/ui/Avatar'
import { Icon } from '@/components/ui/Icon'
import { Badge } from '@/components/ui/Badge'
import { formatRelativeTime } from '@/lib/utils'

type PullRequest = {
  id: string
  number: number
  title: string
  status: 'OPEN' | 'MERGED' | 'CLOSED'
  sourceBranch: string
  targetBranch: string
  createdAt: Date
  author: {
    username: string
  }
  _count: {
    comments: number
  }
}

type PullRequestListProps = {
  pullRequests: PullRequest[]
  owner: string
  repo: string
}

export const PullRequestList = ({ pullRequests, owner, repo }: PullRequestListProps) => {
  if (pullRequests.length === 0) {
    return (
      <div className="text-center py-12 border border-zinc-200 rounded-lg bg-zinc-50/50">
        <Icon name="solar:git-pull-request-linear" size={48} className="text-zinc-300 mx-auto mb-4" />
        <h3 className="text-sm font-medium text-zinc-900 mb-1">No pull requests</h3>
        <p className="text-sm text-zinc-500">Create a pull request to propose changes.</p>
      </div>
    )
  }

  return (
    <div className="border border-zinc-200 rounded-lg overflow-hidden divide-y divide-zinc-100">
      {pullRequests.map((pr) => (
        <Link
          key={pr.id}
          href={`/${owner}/${repo}/pulls/${pr.number}`}
          className="group flex items-center justify-between px-4 py-4 hover:bg-zinc-50 transition-colors"
        >
          <div className="flex items-start gap-3 min-w-0">
            <Icon
              name={
                pr.status === 'OPEN'
                  ? 'solar:git-pull-request-linear'
                  : pr.status === 'MERGED'
                  ? 'solar:git-merge-linear'
                  : 'solar:close-circle-linear'
              }
              size={20}
              className={
                pr.status === 'OPEN'
                  ? 'text-emerald-500'
                  : pr.status === 'MERGED'
                  ? 'text-purple-500'
                  : 'text-red-500'
              }
            />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-zinc-900 group-hover:text-blue-600 transition-colors">
                  {pr.title}
                </span>
              </div>
              <p className="text-xs text-zinc-500 mt-0.5">
                #{pr.number} opened {formatRelativeTime(pr.createdAt)} by {pr.author.username}
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
  )
}
