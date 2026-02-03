'use client'

import { useState, useEffect } from 'react'
import { Icon } from '@/components/ui/Icon'
import type { DiffFile } from '@/types'

type DiffLine = {
  type: 'context' | 'addition' | 'deletion' | 'header'
  content: string
  oldNumber?: number
  newNumber?: number
}

type ParsedHunk = {
  header: string
  lines: DiffLine[]
}

type DiffViewerProps = {
  files: DiffFile[]
  owner?: string
  repo?: string
  sha?: string
  base?: string
  head?: string
}

const parseDiff = (diffText: string): ParsedHunk[] => {
  if (!diffText) return []

  const lines = diffText.split('\n')
  const hunks: ParsedHunk[] = []
  let currentHunk: ParsedHunk | null = null
  let oldLineNum = 0
  let newLineNum = 0

  for (const line of lines) {
    // Skip diff header lines
    if (line.startsWith('diff --git') || line.startsWith('index ') || 
        line.startsWith('---') || line.startsWith('+++') ||
        line.startsWith('new file') || line.startsWith('deleted file')) {
      continue
    }

    // Hunk header
    if (line.startsWith('@@')) {
      const match = line.match(/@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/)
      if (match) {
        oldLineNum = parseInt(match[1])
        newLineNum = parseInt(match[2])
      }
      currentHunk = { header: line, lines: [] }
      hunks.push(currentHunk)
      continue
    }

    if (!currentHunk) continue

    if (line.startsWith('+')) {
      currentHunk.lines.push({
        type: 'addition',
        content: line.substring(1),
        newNumber: newLineNum++,
      })
    } else if (line.startsWith('-')) {
      currentHunk.lines.push({
        type: 'deletion',
        content: line.substring(1),
        oldNumber: oldLineNum++,
      })
    } else if (line.startsWith(' ') || line === '') {
      currentHunk.lines.push({
        type: 'context',
        content: line.substring(1) || '',
        oldNumber: oldLineNum++,
        newNumber: newLineNum++,
      })
    }
  }

  return hunks
}

const FileDiff = ({ 
  file, 
  owner, 
  repo, 
  sha, 
  base, 
  head 
}: { 
  file: DiffFile
  owner?: string
  repo?: string
  sha?: string
  base?: string
  head?: string
}) => {
  const [isExpanded, setIsExpanded] = useState(true)
  const [hunks, setHunks] = useState<ParsedHunk[]>([])
  const [isLoading, setIsLoading] = useState(true) // Start loading
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadDiff = async () => {
      if (!owner || !repo) {
        setIsLoading(false)
        return
      }
      if (!sha && !base) {
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      setError(null)
      
      try {
        let url: string
        if (sha) {
          url = `/api/repos/${owner}/${repo}/diff/${sha}?file=${encodeURIComponent(file.path)}`
        } else if (base && head) {
          url = `/api/repos/${owner}/${repo}/diff/compare?base=${base}&head=${head}&file=${encodeURIComponent(file.path)}`
        } else {
          setIsLoading(false)
          return
        }
        
        const res = await fetch(url)
        
        if (res.ok) {
          const data = await res.json()
          const parsed = parseDiff(data.diff || '')
          setHunks(parsed)
        } else {
          const errData = await res.json().catch(() => ({}))
          setError(errData.error || `Failed to load (${res.status})`)
        }
      } catch {
        setError('Network error')
      } finally {
        setIsLoading(false)
      }
    }

    // Load immediately on mount
    loadDiff()
  }, [owner, repo, sha, base, head, file.path])

  return (
    <div className="border border-zinc-200 dark:border-zinc-700 rounded-lg overflow-hidden bg-white dark:bg-zinc-900 shadow-sm">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full bg-zinc-50/80 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-700 px-4 py-2 flex items-center justify-between hover:bg-zinc-100/80 dark:hover:bg-zinc-800 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Icon
            name={isExpanded ? 'solar:alt-arrow-down-linear' : 'solar:alt-arrow-right-linear'}
            size={14}
            className="text-zinc-400 dark:text-zinc-500"
          />
          <Icon
            name={
              file.status === 'added'
                ? 'solar:add-circle-linear'
                : file.status === 'deleted'
                ? 'solar:trash-bin-minimalistic-linear'
                : 'solar:pen-linear'
            }
            size={14}
            className={
              file.status === 'added'
                ? 'text-emerald-500'
                : file.status === 'deleted'
                ? 'text-red-500'
                : 'text-amber-500'
            }
          />
          <span className="text-sm font-mono text-zinc-700 dark:text-zinc-200">{file.path}</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-emerald-600 dark:text-emerald-400">+{file.additions}</span>
          <span className="text-red-600 dark:text-red-400">-{file.deletions}</span>
        </div>
      </button>

      {isExpanded && (
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="px-4 py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
              <div className="animate-pulse">Loading diff...</div>
            </div>
          ) : error ? (
            <div className="px-4 py-8 text-center text-sm text-red-500 dark:text-red-400">
              Error: {error}
            </div>
          ) : hunks.length > 0 ? (
            hunks.map((hunk, hunkIndex) => (
              <div key={hunkIndex}>
                <div className="bg-blue-50 dark:bg-blue-900/20 px-4 py-1 text-xs font-mono text-blue-700 dark:text-blue-300 border-b border-zinc-100 dark:border-zinc-700">
                  {hunk.header}
                </div>
                <table className="w-full text-xs font-mono">
                  <tbody>
                    {hunk.lines.map((line, lineIndex) => (
                      <tr
                        key={lineIndex}
                        className={
                          line.type === 'addition'
                            ? 'bg-emerald-50 dark:bg-emerald-900/20'
                            : line.type === 'deletion'
                            ? 'bg-red-50 dark:bg-red-900/20'
                            : ''
                        }
                      >
                        <td className="w-12 text-right text-zinc-400 dark:text-zinc-500 select-none px-2 border-r border-zinc-100 dark:border-zinc-700">
                          {line.oldNumber || ''}
                        </td>
                        <td className="w-12 text-right text-zinc-400 dark:text-zinc-500 select-none px-2 border-r border-zinc-100 dark:border-zinc-700">
                          {line.newNumber || ''}
                        </td>
                        <td className="w-6 text-center select-none">
                          {line.type === 'addition' ? (
                            <span className="text-emerald-600 dark:text-emerald-400">+</span>
                          ) : line.type === 'deletion' ? (
                            <span className="text-red-600 dark:text-red-400">-</span>
                          ) : null}
                        </td>
                        <td className="px-2 whitespace-pre text-zinc-900 dark:text-zinc-100">{line.content}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))
          ) : (
            <div className="px-4 py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
              {file.additions === 0 && file.deletions === 0 
                ? 'No changes (binary file or identical content)'
                : 'No diff content available'}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export const DiffViewer = ({ files, owner, repo, sha, base, head }: DiffViewerProps) => {
  if (files.length === 0) {
    return (
      <div className="text-center py-8 border border-zinc-200 dark:border-zinc-700 rounded-lg bg-zinc-50/50 dark:bg-zinc-900/40">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">No changes</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {files.map((file) => (
        <FileDiff 
          key={file.path} 
          file={file} 
          owner={owner}
          repo={repo}
          sha={sha}
          base={base}
          head={head}
        />
      ))}
    </div>
  )
}
