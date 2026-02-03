'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Icon } from '@/components/ui/Icon'

type Collaborator = {
  id: string
  userId: string
  username: string
  email: string
  level: 'READ' | 'WRITE' | 'ADMIN'
}

type CollaboratorsListProps = {
  repoId: string
  owner: string
  repo: string
  collaborators: Collaborator[]
}

export const CollaboratorsList = ({
  repoId,
  owner,
  repo,
  collaborators,
}: CollaboratorsListProps) => {
  const router = useRouter()
  const [isAdding, setIsAdding] = useState(false)
  const [username, setUsername] = useState('')
  const [level, setLevel] = useState<'READ' | 'WRITE' | 'ADMIN'>('READ')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [removingId, setRemovingId] = useState<string | null>(null)

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const res = await fetch(`/api/repos/${owner}/${repo}/collaborators`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, level }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to add collaborator')
        return
      }

      setIsAdding(false)
      setUsername('')
      router.refresh()
    } catch {
      setError('An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemove = async (permissionId: string) => {
    setRemovingId(permissionId)

    try {
      await fetch(`/api/repos/${owner}/${repo}/collaborators/${permissionId}`, {
        method: 'DELETE',
      })
      router.refresh()
    } catch {
      // Handle error
    } finally {
      setRemovingId(null)
    }
  }

  return (
    <div className="border border-zinc-200 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 overflow-hidden">
      {collaborators.length > 0 ? (
        <div className="divide-y divide-zinc-100 dark:divide-zinc-700">
          {collaborators.map((collab) => (
            <div key={collab.id} className="px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar name={collab.username} size="sm" />
                <div>
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{collab.username}</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">{collab.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge
                  variant={
                    collab.level === 'ADMIN'
                      ? 'danger'
                      : collab.level === 'WRITE'
                      ? 'warning'
                      : 'default'
                  }
                >
                  {collab.level.toLowerCase()}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemove(collab.id)}
                  disabled={removingId === collab.id}
                >
                  <Icon name="solar:trash-bin-minimalistic-linear" size={14} className="text-red-500" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="px-4 py-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
          No collaborators added yet
        </div>
      )}

      {isAdding ? (
        <form
          onSubmit={handleAdd}
          className="p-4 border-t border-zinc-200 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-900/50 space-y-4"
        >
          {error ? (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm rounded-md p-3">
              {error}
            </div>
          ) : null}

          <div className="flex items-end gap-3">
            <div className="flex-1 space-y-1.5">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Username</label>
              <Input
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Permission</label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value as 'READ' | 'WRITE' | 'ADMIN')}
                className="px-3 py-1.5 text-sm border border-zinc-200 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
              >
                <option value="READ">Read</option>
                <option value="WRITE">Write</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setIsAdding(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isLoading}>
              Add collaborator
            </Button>
          </div>
        </form>
      ) : (
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-900/50">
          <Button variant="secondary" onClick={() => setIsAdding(true)} className="w-full">
            <Icon name="solar:add-circle-linear" size={14} />
            Add collaborator
          </Button>
        </div>
      )}
    </div>
  )
}
