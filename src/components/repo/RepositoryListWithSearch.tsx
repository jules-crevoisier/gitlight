'use client'

import { useState, useMemo } from 'react'
import { RepositoryList } from './RepositoryList'
import { Input } from '@/components/ui/Input'
import { Icon } from '@/components/ui/Icon'

type Repository = {
  id: string
  name: string
  description: string | null
  isPublic: boolean
  updatedAt: Date
  owner: { username: string }
  _count: { pullRequests: number }
}

type RepositoryListWithSearchProps = {
  repositories: Repository[]
  currentUserId: string
}

export const RepositoryListWithSearch = ({
  repositories,
  currentUserId,
}: RepositoryListWithSearchProps) => {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    if (!query.trim()) return repositories
    const q = query.trim().toLowerCase()
    return repositories.filter(
      (repo) =>
        repo.name.toLowerCase().includes(q) ||
        repo.owner.username.toLowerCase().includes(q) ||
        (repo.description?.toLowerCase().includes(q) ?? false)
    )
  }, [repositories, query])

  return (
    <>
      <div className="mb-6">
        <Input
          placeholder="Find a repository..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          icon={<Icon name="solar:magnifer-linear" size={14} />}
          className="max-w-md"
        />
        {query && (
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5">
            {filtered.length} of {repositories.length} repositories
          </p>
        )}
      </div>
      <RepositoryList repositories={filtered} currentUserId={currentUserId} />
    </>
  )
}
