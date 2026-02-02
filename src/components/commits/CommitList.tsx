import Link from 'next/link'
import { Avatar } from '@/components/ui/Avatar'
import { Icon } from '@/components/ui/Icon'
import { truncateHash, formatRelativeTime } from '@/lib/utils'
import type { CommitInfo } from '@/types'

type CommitListProps = {
  commits: CommitInfo[]
  owner: string
  repo: string
}

export const CommitList = ({ commits, owner, repo }: CommitListProps) => {
  if (commits.length === 0) {
    return (
      <div className="text-center py-12 border border-zinc-200 rounded-lg bg-zinc-50/50">
        <Icon name="solar:git-commit-linear" size={48} className="text-zinc-300 mx-auto mb-4" />
        <h3 className="text-sm font-medium text-zinc-900 mb-1">No commits yet</h3>
        <p className="text-sm text-zinc-500">Push your first commit to see it here.</p>
      </div>
    )
  }

  // Group commits by date
  const groupedCommits = commits.reduce((groups, commit) => {
    const date = new Date(commit.date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
    
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(commit)
    return groups
  }, {} as Record<string, CommitInfo[]>)

  return (
    <div className="space-y-6">
      {Object.entries(groupedCommits).map(([date, dateCommits]) => (
        <div key={date}>
          <h3 className="text-sm font-medium text-zinc-700 mb-3 flex items-center gap-2">
            <Icon name="solar:calendar-linear" size={14} className="text-zinc-400" />
            {date}
          </h3>
          
          <div className="border border-zinc-200 rounded-lg overflow-hidden divide-y divide-zinc-100">
            {dateCommits.map((commit) => (
              <Link
                key={commit.hash}
                href={`/${owner}/${repo}/commit/${commit.hash}`}
                className="group flex items-center justify-between px-4 py-3 hover:bg-zinc-50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar name={commit.author.name} size="sm" />
                  <div className="min-w-0">
                    <p className="text-sm text-zinc-900 font-medium truncate group-hover:text-blue-600 transition-colors">
                      {commit.message}
                    </p>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      {commit.author.name} · {formatRelativeTime(commit.date)}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 shrink-0">
                  <span className="font-mono text-[10px] text-zinc-400 bg-zinc-50 border border-zinc-200 px-1.5 py-0.5 rounded">
                    {truncateHash(commit.hash)}
                  </span>
                  <Icon name="solar:alt-arrow-right-linear" size={14} className="text-zinc-300 group-hover:text-zinc-500" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
