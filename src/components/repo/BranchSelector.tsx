'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Icon } from '@/components/ui/Icon'
import { cn } from '@/lib/utils'

type BranchSelectorProps = {
  owner: string
  repo: string
  currentBranch: string
  defaultBranch?: string
  basePath?: string
}

export const BranchSelector = ({
  owner,
  repo,
  currentBranch,
  defaultBranch = 'main',
  basePath = '',
}: BranchSelectorProps) => {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [branches, setBranches] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleOpen = async () => {
    setIsOpen(!isOpen)
    
    if (!isOpen && branches.length === 0) {
      setIsLoading(true)
      try {
        const res = await fetch(`/api/repos/${owner}/${repo}/branches`)
        const data = await res.json()
        setBranches(data.branches || [currentBranch])
      } catch {
        setBranches([currentBranch])
      } finally {
        setIsLoading(false)
      }
    }
  }

  const handleSelect = (branch: string) => {
    setIsOpen(false)
    if (branch !== currentBranch) {
      const currentPath = window.location.pathname
      let path: string

      if (basePath) {
        // Determine if we're in a tree or blob view
        const viewType = currentPath.includes('/blob/') ? 'blob' : 'tree'
        path = `/${owner}/${repo}/${viewType}/${branch}/${basePath}`
      } else if (currentPath.includes('/commits')) {
        // Stay on commits page
        if (branch === defaultBranch) {
          path = `/${owner}/${repo}/commits`
        } else {
          path = `/${owner}/${repo}/commits?ref=${encodeURIComponent(branch)}`
        }
      } else if (branch === defaultBranch) {
        // Default branch - no query param needed
        path = `/${owner}/${repo}`
      } else {
        // Non-default branch - use query param
        path = `/${owner}/${repo}?ref=${encodeURIComponent(branch)}`
      }
      router.push(path)
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={handleOpen}
        className="flex items-center gap-2 px-3 py-1.5 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-600 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors text-zinc-700 dark:text-zinc-200 font-medium"
      >
        <Icon name="solar:branch-linear" size={16} />
        {currentBranch}
        <Icon name="solar:alt-arrow-down-linear" size={12} className="ml-1 text-zinc-400 dark:text-zinc-500" />
      </button>

      {isOpen ? (
        <div className="absolute top-full left-0 mt-1 w-48 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-600 rounded-md shadow-lg z-50">
          <div className="p-2 border-b border-zinc-100 dark:border-zinc-700">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Switch branches</span>
          </div>
          <div className="max-h-64 overflow-y-auto py-1">
            {isLoading ? (
              <div className="px-3 py-2 text-sm text-zinc-500 dark:text-zinc-400">Loading...</div>
            ) : (
              branches.map((branch) => (
                <button
                  key={branch}
                  onClick={() => handleSelect(branch)}
                  className={cn(
                    'w-full text-left px-3 py-1.5 text-sm text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700/60 transition-colors flex items-center gap-2',
                    branch === currentBranch && 'text-zinc-900 dark:text-zinc-100 font-medium'
                  )}
                >
                  {branch === currentBranch ? (
                    <Icon name="solar:check-circle-linear" size={14} className="text-emerald-500" />
                  ) : (
                    <span className="w-3.5" />
                  )}
                  {branch}
                </button>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}
