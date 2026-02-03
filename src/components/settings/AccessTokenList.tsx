'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Icon } from '@/components/ui/Icon'
import { Badge } from '@/components/ui/Badge'
import { formatRelativeTime } from '@/lib/utils'

type AccessToken = {
  id: string
  name: string
  scopes: string[]
  expiresAt: Date | null
  createdAt: Date
  lastUsed: Date | null
}

type AccessTokenListProps = {
  tokens: AccessToken[]
}

export const AccessTokenList = ({ tokens }: AccessTokenListProps) => {
  const router = useRouter()
  const [isAdding, setIsAdding] = useState(false)
  const [name, setName] = useState('')
  const [scopes, setScopes] = useState<string[]>(['repo:read'])
  const [expiresInDays, setExpiresInDays] = useState<string>('90')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [newToken, setNewToken] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const res = await fetch('/api/settings/tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          scopes,
          expiresInDays: expiresInDays ? parseInt(expiresInDays) : undefined,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to create token')
        return
      }

      setNewToken(data.token.token)
      setIsAdding(false)
      setName('')
      router.refresh()
    } catch {
      setError('An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (tokenId: string) => {
    setDeletingId(tokenId)

    try {
      const res = await fetch(`/api/settings/tokens/${tokenId}`, {
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

  const toggleScope = (scope: string) => {
    setScopes((prev) =>
      prev.includes(scope) ? prev.filter((s) => s !== scope) : [...prev, scope]
    )
  }

  return (
    <div className="border border-zinc-200 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 overflow-hidden">
      {/* New token display */}
      {newToken ? (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 border-b border-emerald-200 dark:border-emerald-800">
          <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300 mb-2">
            Your new access token (copy it now - you won&apos;t see it again):
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-white dark:bg-zinc-800 px-3 py-2 rounded border border-emerald-200 dark:border-emerald-700 text-sm font-mono text-zinc-900 dark:text-zinc-100">
              {newToken}
            </code>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(newToken)
              }}
            >
              <Icon name="solar:copy-linear" size={14} />
            </Button>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setNewToken(null)}
            className="mt-2"
          >
            Dismiss
          </Button>
        </div>
      ) : null}

      {tokens.length > 0 ? (
        <div className="divide-y divide-zinc-100 dark:divide-zinc-600">
          {tokens.map((token) => (
            <div key={token.id} className="px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{token.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  {token.scopes.map((scope) => (
                    <Badge key={scope} variant="default" className="text-[9px]">
                      {scope}
                    </Badge>
                  ))}
                </div>
                <p className="text-xs text-zinc-400 mt-1">
                  Created {formatRelativeTime(token.createdAt)}
                  {token.lastUsed
                    ? ` · Last used ${formatRelativeTime(token.lastUsed)}`
                    : ' · Never used'}
                  {token.expiresAt
                    ? ` · Expires ${formatRelativeTime(token.expiresAt)}`
                    : ''}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(token.id)}
                disabled={deletingId === token.id}
              >
                <Icon name="solar:trash-bin-minimalistic-linear" size={14} className="text-red-500" />
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <div className="px-4 py-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
          No access tokens created yet
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
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Token name</label>
            <Input
              placeholder="My CI token"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Scopes</label>
            <div className="flex flex-wrap gap-2">
              {['repo:read', 'repo:write', 'user:read'].map((scope) => (
                <label
                  key={scope}
                  className="flex items-center gap-2 px-3 py-1.5 border border-zinc-200 rounded-md cursor-pointer hover:bg-zinc-100"
                >
                  <input
                    type="checkbox"
                    checked={scopes.includes(scope)}
                    onChange={() => toggleScope(scope)}
                  />
                  <span className="text-sm">{scope}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Expires in (days)</label>
            <select
              value={expiresInDays}
              onChange={(e) => setExpiresInDays(e.target.value)}
              className="w-full px-3 py-1.5 text-sm border border-zinc-200 rounded-md"
            >
              <option value="30">30 days</option>
              <option value="90">90 days</option>
              <option value="365">1 year</option>
              <option value="">Never</option>
            </select>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setIsAdding(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isLoading}>
              Create token
            </Button>
          </div>
        </form>
      ) : (
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-700/50">
          <Button variant="secondary" onClick={() => setIsAdding(true)} className="w-full">
            <Icon name="solar:add-circle-linear" size={14} />
            Create access token
          </Button>
        </div>
      )}
    </div>
  )
}
