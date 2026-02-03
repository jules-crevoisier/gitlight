'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/Input'
import { Icon } from '@/components/ui/Icon'
import { cn } from '@/lib/utils'

type RepoSearchProps = {
  owner: string
  repo: string
  branch: string
  className?: string
}

type SearchResult = {
  file: string
  line: number
  content: string
}

export const RepoSearch = ({ owner, repo, branch, className }: RepoSearchProps) => {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const doSearch = useCallback(async () => {
    if (query.length < 2) {
      setResults([])
      return
    }
    setIsLoading(true)
    try {
      const res = await fetch(
        `/api/repos/${owner}/${repo}/search?q=${encodeURIComponent(query)}&ref=${encodeURIComponent(branch)}`
      )
      const data = await res.json()
      setResults(data.results || [])
    } catch {
      setResults([])
    } finally {
      setIsLoading(false)
    }
  }, [owner, repo, branch, query])

  useEffect(() => {
    const t = setTimeout(doSearch, 300)
    return () => clearTimeout(t)
  }, [doSearch])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false)
      }
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault()
        setIsOpen(true)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleSelect = (file: string, line: number) => {
    setIsOpen(false)
    setQuery('')
    const path = file
    router.push(`/${owner}/${repo}/blob/${branch}/${path}#L${line}`)
  }

  return (
    <div className={cn('relative', className)}>
      <Input
        placeholder="Search in repo (/)"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          setIsOpen(true)
        }}
        onFocus={() => setIsOpen(true)}
        icon={<Icon name="solar:magnifer-linear" size={14} />}
        className="w-full sm:w-64"
      />
      {isOpen && (query.length >= 2 || results.length > 0) ? (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
            aria-hidden
          />
          <div className="absolute top-full left-0 mt-1 w-full sm:w-96 max-h-80 overflow-y-auto bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-xl z-50">
            {isLoading ? (
              <div className="p-4 text-sm text-zinc-500 dark:text-zinc-400">Searching...</div>
            ) : results.length === 0 && query.length >= 2 ? (
              <div className="p-4 text-sm text-zinc-500 dark:text-zinc-400">No results</div>
            ) : (
              <ul className="py-2">
                {results.slice(0, 50).map((r, i) => (
                  <li key={`${r.file}-${r.line}-${i}`}>
                    <button
                      type="button"
                      onClick={() => handleSelect(r.file, r.line)}
                      className="w-full text-left px-4 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 text-sm font-mono truncate"
                    >
                      <span className="text-zinc-900 dark:text-zinc-100">{r.file}</span>
                      <span className="text-zinc-400 dark:text-zinc-500 ml-2">:{r.line}</span>
                      <div className="text-zinc-500 dark:text-zinc-400 truncate mt-0.5">{r.content}</div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      ) : null}
    </div>
  )
}
