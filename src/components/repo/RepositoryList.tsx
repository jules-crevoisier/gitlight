import Link from 'next/link'
import { Icon } from '@/components/ui/Icon'
import { Badge } from '@/components/ui/Badge'
import { formatRelativeTime } from '@/lib/utils'

type Repository = {
  id: string
  name: string
  description: string | null
  isPublic: boolean
  updatedAt: Date
  owner: {
    username: string
  }
  _count: {
    pullRequests: number
  }
}

type RepositoryListProps = {
  repositories: Repository[]
  currentUserId: string
}

export const RepositoryList = ({ repositories, currentUserId }: RepositoryListProps) => {
  if (repositories.length === 0) {
    return (
      <div className="text-center py-12 border border-zinc-200 dark:border-zinc-600 rounded-lg bg-zinc-50/50 dark:bg-zinc-800/50">
        <Icon name="solar:code-square-linear" size={48} className="text-zinc-300 dark:text-zinc-500 mx-auto mb-4" />
        <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-1">No repositories yet</h3>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Create your first repository to get started.</p>
      </div>
    )
  }

  return (
    <div className="border border-zinc-200 dark:border-zinc-600 rounded-lg overflow-hidden divide-y divide-zinc-100 dark:divide-zinc-700">
      {repositories.map((repo) => (
        <Link
          key={repo.id}
          href={`/${repo.owner.username}/${repo.name}`}
          className="group flex items-center justify-between px-4 py-4 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
        >
          <div className="flex items-center gap-3 min-w-0">
            <Icon
              name="solar:code-square-linear"
              size={20}
              className="text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-600 dark:group-hover:text-zinc-400 shrink-0"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600 transition-colors">
                  {repo.owner.username}/{repo.name}
                </span>
                <Badge variant={repo.isPublic ? 'default' : 'info'}>
                  {repo.isPublic ? 'Public' : 'Private'}
                </Badge>
              </div>
              {repo.description ? (
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">{repo.description}</p>
              ) : null}
            </div>
          </div>
          
          <div className="flex items-center gap-4 text-xs text-zinc-400 dark:text-zinc-500 shrink-0">
            {repo._count.pullRequests > 0 ? (
              <span className="flex items-center gap-1">
                <Icon name="solar:git-pull-request-linear" size={14} />
                {repo._count.pullRequests}
              </span>
            ) : null}
            <span>{formatRelativeTime(repo.updatedAt)}</span>
          </div>
        </Link>
      ))}
    </div>
  )
}
