import Link from 'next/link'
import { Icon } from '@/components/ui/Icon'
import { formatRelativeTime, truncateHash } from '@/lib/utils'
import type { TreeEntry, CommitInfo } from '@/types'

type FileBrowserProps = {
  owner: string
  repo: string
  branch: string
  path: string
  tree: TreeEntry[]
  lastCommit: CommitInfo | null
}

const getFileIcon = (name: string, type: 'blob' | 'tree'): { icon: string; color: string } => {
  if (type === 'tree') {
    return { icon: 'solar:folder-linear', color: 'text-blue-500' }
  }

  const ext = name.split('.').pop()?.toLowerCase() || ''
  
  const iconMap: Record<string, { icon: string; color: string }> = {
    // Code files
    ts: { icon: 'solar:file-code-linear', color: 'text-blue-500' },
    tsx: { icon: 'solar:file-code-linear', color: 'text-blue-500' },
    js: { icon: 'solar:file-code-linear', color: 'text-amber-500' },
    jsx: { icon: 'solar:file-code-linear', color: 'text-amber-500' },
    json: { icon: 'solar:file-code-linear', color: 'text-amber-500/80' },
    py: { icon: 'solar:file-code-linear', color: 'text-blue-600' },
    rb: { icon: 'solar:file-code-linear', color: 'text-red-500' },
    go: { icon: 'solar:file-code-linear', color: 'text-cyan-500' },
    rs: { icon: 'solar:file-code-linear', color: 'text-orange-500' },
    // Config files
    yml: { icon: 'solar:file-code-linear', color: 'text-purple-500' },
    yaml: { icon: 'solar:file-code-linear', color: 'text-purple-500' },
    toml: { icon: 'solar:file-code-linear', color: 'text-zinc-500' },
    // Documentation
    md: { icon: 'solar:file-text-linear', color: 'text-zinc-400' },
    txt: { icon: 'solar:document-text-linear', color: 'text-zinc-400' },
    // Special files
    gitignore: { icon: 'solar:file-code-linear', color: 'text-zinc-400' },
    env: { icon: 'solar:file-code-linear', color: 'text-emerald-500' },
    lock: { icon: 'solar:lock-linear', color: 'text-zinc-400' },
  }

  // Check for special filenames
  if (name === 'LICENSE' || name === 'LICENSE.md') {
    return { icon: 'solar:document-text-linear', color: 'text-zinc-400' }
  }
  if (name === 'package.json') {
    return { icon: 'solar:file-code-linear', color: 'text-amber-500/80' }
  }
  if (name.startsWith('.')) {
    return { icon: 'solar:file-code-linear', color: 'text-zinc-400' }
  }

  return iconMap[ext] || { icon: 'solar:file-linear', color: 'text-zinc-400' }
}

export const FileBrowser = ({
  owner,
  repo,
  branch,
  path,
  tree,
  lastCommit,
}: FileBrowserProps) => {
  return (
    <div className="border border-border rounded-lg overflow-hidden bg-background shadow-sm">
      {/* Header */}
      <div className="bg-background-muted/80 border-b border-border px-4 py-3 flex items-center justify-between text-xs text-foreground-muted backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300 flex items-center justify-center border border-blue-100 dark:border-blue-800">
            <Icon name="solar:user-linear" size={10} />
          </div>
          {lastCommit ? (
            <>
              <span className="font-medium text-foreground">{lastCommit.author.name}</span>
              <span className="truncate max-w-[200px] sm:max-w-md">{lastCommit.message}</span>
            </>
          ) : (
            <span className="text-foreground-muted">No commits yet</span>
          )}
        </div>
        {lastCommit ? (
          <div className="font-mono text-[10px] text-foreground-muted bg-background border border-border px-1.5 py-0.5 rounded">
            {truncateHash(lastCommit.hash)}
          </div>
        ) : null}
      </div>

      {/* File List */}
      <div className="divide-y divide-border">
        {/* Parent directory link */}
        {path ? (
          <Link
            href={
              path.includes('/')
                ? `/${owner}/${repo}/tree/${branch}/${path.split('/').slice(0, -1).join('/')}`
                : `/${owner}/${repo}`
            }
            className="group flex items-center justify-between px-4 py-2.5 hover:bg-background-muted/60 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3 min-w-0">
              <Icon name="solar:folder-linear" size={18} className="text-blue-500" />
              <span className="text-sm text-foreground font-medium group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                ..
              </span>
            </div>
          </Link>
        ) : null}

        {tree.map((entry) => {
          const { icon, color } = getFileIcon(entry.name, entry.type)
          const href =
            entry.type === 'tree'
              ? `/${owner}/${repo}/tree/${branch}/${entry.path}`
              : `/${owner}/${repo}/blob/${branch}/${entry.path}`

          return (
            <Link
              key={entry.path}
              href={href}
              className="group flex items-center justify-between px-4 py-2.5 hover:bg-background-muted/60 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3 min-w-0">
                <Icon name={icon} size={18} className={color} />
                <span
                  className={`text-sm font-medium transition-colors ${
                    entry.type === 'tree'
                      ? 'text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400'
                      : 'text-foreground group-hover:text-foreground'
                  }`}
                >
                  {entry.name}
                </span>
              </div>
              <span className="text-xs text-foreground-muted tabular-nums">
                {/* Placeholder - would need commit info per file */}
              </span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
