import { Icon } from '@/components/ui/Icon'
import { truncateHash, formatRelativeTime, isImageFile, getFileExtension } from '@/lib/utils'
import type { CommitInfo } from '@/types'

type CodeViewerProps = {
  filename: string
  content: string
  isBinary: boolean
  lastCommit: CommitInfo | null
}

const getLanguage = (filename: string): string => {
  const ext = getFileExtension(filename).toLowerCase()
  
  const langMap: Record<string, string> = {
    ts: 'typescript',
    tsx: 'tsx',
    js: 'javascript',
    jsx: 'jsx',
    json: 'json',
    py: 'python',
    rb: 'ruby',
    go: 'go',
    rs: 'rust',
    md: 'markdown',
    yml: 'yaml',
    yaml: 'yaml',
    css: 'css',
    scss: 'scss',
    html: 'html',
    xml: 'xml',
    sql: 'sql',
    sh: 'bash',
    bash: 'bash',
    zsh: 'bash',
  }

  return langMap[ext] || 'plaintext'
}

export const CodeViewer = ({ filename, content, isBinary, lastCommit }: CodeViewerProps) => {
  if (isBinary) {
    if (isImageFile(filename)) {
      return (
        <div className="border border-zinc-200 dark:border-zinc-700 rounded-lg overflow-hidden bg-white dark:bg-zinc-900 shadow-sm">
          <div className="bg-zinc-50 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700 px-4 py-2 flex items-center gap-2">
            <Icon name="solar:gallery-linear" size={16} className="text-zinc-500 dark:text-zinc-400" />
            <span className="text-xs font-medium text-zinc-700 dark:text-zinc-200">{filename}</span>
          </div>
          <div className="p-8 flex items-center justify-center bg-zinc-50/50 dark:bg-zinc-900/50">
            <img
              src={`data:image/${getFileExtension(filename)};base64,${content}`}
              alt={filename}
              className="max-w-full max-h-96 object-contain"
            />
          </div>
        </div>
      )
    }

    return (
      <div className="border border-zinc-200 dark:border-zinc-700 rounded-lg overflow-hidden bg-white dark:bg-zinc-900 shadow-sm">
        <div className="bg-zinc-50 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700 px-4 py-2 flex items-center gap-2">
          <Icon name="solar:file-linear" size={16} className="text-zinc-500 dark:text-zinc-400" />
          <span className="text-xs font-medium text-zinc-700 dark:text-zinc-200">{filename}</span>
        </div>
        <div className="p-8 text-center text-zinc-500 dark:text-zinc-400">
          <Icon name="solar:file-corrupted-linear" size={48} className="mx-auto mb-4 text-zinc-300 dark:text-zinc-600" />
          <p className="text-sm">Binary file cannot be displayed</p>
        </div>
      </div>
    )
  }

  const lines = content.split('\n')
  const lineNumberWidth = String(lines.length).length

  return (
    <div className="border border-zinc-200 dark:border-zinc-700 rounded-lg overflow-hidden bg-white dark:bg-zinc-900 shadow-sm">
      {/* Header */}
      <div className="bg-zinc-50/80 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-700 px-4 py-3 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
        <div className="flex items-center gap-3">
          <Icon name="solar:file-code-linear" size={16} className="text-zinc-400 dark:text-zinc-500" />
          <span className="font-medium text-zinc-700 dark:text-zinc-200">{filename}</span>
          {lastCommit ? (
            <>
              <span className="text-zinc-300">·</span>
              <span className="truncate max-w-[200px]">{lastCommit.message}</span>
            </>
          ) : null}
        </div>
        {lastCommit ? (
          <div className="flex items-center gap-2">
            <span>{formatRelativeTime(lastCommit.date)}</span>
            <span className="font-mono text-[10px] text-zinc-400 dark:text-zinc-500 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 px-1.5 py-0.5 rounded">
              {truncateHash(lastCommit.hash)}
            </span>
          </div>
        ) : null}
      </div>

      {/* Code */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs font-mono">
          <tbody>
            {lines.map((line, index) => (
              <tr key={index} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/60 group">
                <td
                  className="text-right text-zinc-400 dark:text-zinc-500 select-none px-3 py-0 border-r border-zinc-100 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-900/50 sticky left-0"
                  style={{ width: `${lineNumberWidth + 2}ch` }}
                >
                  {index + 1}
                </td>
                <td className="px-4 py-0 whitespace-pre text-zinc-900 dark:text-zinc-100">
                  {line || ' '}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
