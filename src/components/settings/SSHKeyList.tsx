'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Icon } from '@/components/ui/Icon'
import { formatRelativeTime } from '@/lib/utils'

type SSHKey = {
  id: string
  title: string
  fingerprint: string
  createdAt: Date
}

type SSHKeyListProps = {
  keys: SSHKey[]
}

export const SSHKeyList = ({ keys }: SSHKeyListProps) => {
  const router = useRouter()
  const [isAdding, setIsAdding] = useState(false)
  const [title, setTitle] = useState('')
  const [publicKey, setPublicKey] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const res = await fetch('/api/settings/ssh-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, publicKey }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to add SSH key')
        return
      }

      setIsAdding(false)
      setTitle('')
      setPublicKey('')
      router.refresh()
    } catch {
      setError('An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (keyId: string) => {
    setDeletingId(keyId)

    try {
      const res = await fetch(`/api/settings/ssh-keys/${keyId}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        router.refresh()
      }
    } catch {
      // Handle error
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="border border-zinc-200 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 overflow-hidden">
      {keys.length > 0 ? (
        <div className="divide-y divide-zinc-100 dark:divide-zinc-600">
          {keys.map((key) => (
            <div key={key.id} className="px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{key.title}</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono mt-0.5">{key.fingerprint}</p>
                <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
                  Added {formatRelativeTime(key.createdAt)}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(key.id)}
                disabled={deletingId === key.id}
              >
                <Icon name="solar:trash-bin-minimalistic-linear" size={14} className="text-red-500" />
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <div className="px-4 py-6 text-center text-sm text-zinc-500">
          No SSH keys added yet
        </div>
      )}

      {isAdding ? (
        <form onSubmit={handleAdd} className="p-4 border-t border-zinc-200 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-700/50 space-y-4">
          {error ? (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm rounded-md p-3">
              {error}
            </div>
          ) : null}

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Title</label>
            <Input
              placeholder="My laptop"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Public Key</label>
            <textarea
              placeholder="ssh-ed25519 AAAAC3..."
              value={publicKey}
              onChange={(e) => setPublicKey(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 text-sm font-mono border border-zinc-200 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-zinc-900/5"
              required
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setIsAdding(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isLoading}>
              Add SSH key
            </Button>
          </div>
        </form>
      ) : (
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-700/50">
          <Button variant="secondary" onClick={() => setIsAdding(true)} className="w-full">
            <Icon name="solar:add-circle-linear" size={14} />
            Add SSH key
          </Button>
        </div>
      )}
    </div>
  )
}
