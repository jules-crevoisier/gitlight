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
    <div className="border border-zinc-200 dark:border-zinc-700 rounded-lg overflow-hidden bg-white dark:bg-zinc-900 shadow-sm">
      {/* Header */}
      <div className="bg-zinc-50/80 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-700 px-4 py-3 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300 flex items-center justify-center border border-blue-100 dark:border-blue-800">
            <Icon name="solar:user-linear" size={10} />
          </div>
          {lastCommit ? (
            <>
              <span className="font-medium text-zinc-700 dark:text-zinc-200">{lastCommit.author.name}</span>
              <span className="truncate max-w-[200px] sm:max-w-md">{lastCommit.message}</span>
            </>
          ) : (
            <span className="text-zinc-400 dark:text-zinc-500">No commits yet</span>
          )}
        </div>
        {lastCommit ? (
          <div className="font-mono text-[10px] text-zinc-400 dark:text-zinc-500 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 px-1.5 py-0.5 rounded">
            {truncateHash(lastCommit.hash)}
          </div>
        ) : null}
      </div>

      {/* File List */}
      <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
        {/* Parent directory link */}
        {path ? (
          <Link
            href={
              path.includes('/')
                ? `/${owner}/${repo}/tree/${branch}/${path.split('/').slice(0, -1).join('/')}`
                : `/${owner}/${repo}`
            }
            className="group flex items-center justify-between px-4 py-2.5 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3 min-w-0">
              <Icon name="solar:folder-linear" size={18} className="text-blue-500" />
              <span className="text-sm text-zinc-700 dark:text-zinc-200 font-medium group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
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
              className="group flex items-center justify-between px-4 py-2.5 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3 min-w-0">
                <Icon name={icon} size={18} className={color} />
                <span
                  className={`text-sm font-medium transition-colors ${
                    entry.type === 'tree'
                      ? 'text-zinc-700 dark:text-zinc-200 group-hover:text-blue-600 dark:group-hover:text-blue-400'
                      : 'text-zinc-700 dark:text-zinc-200 group-hover:text-zinc-900 dark:group-hover:text-zinc-100'
                  }`}
                >
                  {entry.name}
                </span>
              </div>
              <span className="text-xs text-zinc-400 dark:text-zinc-500 tabular-nums">
                {/* Placeholder - would need commit info per file */}
              </span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
