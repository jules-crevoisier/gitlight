'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Icon } from '@/components/ui/Icon'

type CreatePRButtonProps = {
  owner: string
  repo: string
}

type BranchInfo = {
  name: string
  isDefault: boolean
}

export const CreatePRButton = ({ owner, repo }: CreatePRButtonProps) => {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [sourceBranch, setSourceBranch] = useState('')
  const [targetBranch, setTargetBranch] = useState('')
  const [branches, setBranches] = useState<BranchInfo[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [comparison, setComparison] = useState<{ ahead: number; behind: number } | null>(null)

  useEffect(() => {
    if (isOpen && branches.length === 0) {
      fetch(`/api/repos/${owner}/${repo}/branches`)
        .then((res) => res.json())
        .then((data) => {
          const branchList: BranchInfo[] = (data.branches || []).map((b: string | { name: string; isDefault: boolean }) =>
            typeof b === 'string' ? { name: b, isDefault: false } : b
          )
          setBranches(branchList)
          if (branchList.length > 0) {
            const defaultBranch = branchList.find(b => b.isDefault) || branchList[0]
            setTargetBranch(defaultBranch.name)
          }
        })
        .catch(() => setBranches([]))
    }
  }, [isOpen, owner, repo, branches.length])

  // Fetch comparison when branches change
  useEffect(() => {
    if (sourceBranch && targetBranch && sourceBranch !== targetBranch) {
      fetch(`/api/repos/${owner}/${repo}/compare?base=${targetBranch}&head=${sourceBranch}`)
        .then((res) => res.json())
        .then((data) => setComparison(data))
        .catch(() => setComparison(null))
    } else {
      setComparison(null)
    }
  }, [sourceBranch, targetBranch, owner, repo])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!sourceBranch || !targetBranch) {
      setError('Please select both branches')
      return
    }

    if (sourceBranch === targetBranch) {
      setError('Source and target branches must be different')
      return
    }

    setIsLoading(true)

    try {
      const res = await fetch(`/api/repos/${owner}/${repo}/pulls`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, sourceBranch, targetBranch }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to create pull request')
        return
      }

      setIsOpen(false)
      router.refresh()
      router.push(`/${owner}/${repo}/pulls/${data.pullRequest.number}`)
    } catch {
      setError('An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>
        <Icon name="solar:add-circle-linear" size={14} />
        New pull request
      </Button>

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
          <div className="relative bg-white rounded-lg border border-zinc-200 shadow-xl w-full max-w-lg mx-4 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-zinc-900">Create pull request</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-zinc-400 hover:text-zinc-600"
              >
                <Icon name="solar:close-circle-linear" size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error ? (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-md p-3">
                  {error}
                </div>
              ) : null}

              {/* Branch Selection */}
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-zinc-50 rounded-lg border border-zinc-200">
                  <div className="flex-1">
                    <label className="text-xs font-medium text-zinc-500 mb-1.5 block">
                      Merge from (your changes)
                    </label>
                    <select
                      value={sourceBranch}
                      onChange={(e) => setSourceBranch(e.target.value)}
                      className="w-full px-3 py-1.5 text-sm border border-zinc-200 rounded-md bg-white font-mono"
                    >
                      <option value="">Select branch...</option>
                      {branches
                        .filter((b) => b.name !== targetBranch)
                        .map((b) => (
                          <option key={b.name} value={b.name}>{b.name}</option>
                        ))}
                    </select>
                  </div>
                  <div className="flex flex-col items-center gap-1 px-2">
                    <Icon name="solar:arrow-right-linear" size={20} className="text-zinc-400" />
                    <span className="text-[10px] text-zinc-400">into</span>
                  </div>
                  <div className="flex-1">
                    <label className="text-xs font-medium text-zinc-500 mb-1.5 block">
                      Merge into (base)
                    </label>
                    <select
                      value={targetBranch}
                      onChange={(e) => setTargetBranch(e.target.value)}
                      className="w-full px-3 py-1.5 text-sm border border-zinc-200 rounded-md bg-white font-mono"
                    >
                      {branches.map((b) => (
                        <option key={b.name} value={b.name}>
                          {b.name}{b.isDefault ? ' (default)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Comparison info */}
                {comparison && sourceBranch ? (
                  <div className="flex items-center gap-4 text-xs">
                    {comparison.ahead > 0 ? (
                      <span className="text-emerald-600 flex items-center gap-1">
                        <Icon name="solar:arrow-up-linear" size={12} />
                        {comparison.ahead} commit{comparison.ahead > 1 ? 's' : ''} ahead
                      </span>
                    ) : null}
                    {comparison.behind > 0 ? (
                      <span className="text-amber-600 flex items-center gap-1">
                        <Icon name="solar:arrow-down-linear" size={12} />
                        {comparison.behind} commit{comparison.behind > 1 ? 's' : ''} behind
                      </span>
                    ) : null}
                    {comparison.ahead === 0 && comparison.behind === 0 ? (
                      <span className="text-zinc-500">Branches are identical</span>
                    ) : null}
                    {comparison.ahead === 0 && comparison.behind > 0 ? (
                      <span className="text-zinc-500">Nothing to merge (source is behind target)</span>
                    ) : null}
                  </div>
                ) : null}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="title" className="text-sm font-medium text-zinc-700">
                  Title
                </label>
                <Input
                  id="title"
                  type="text"
                  placeholder="Add a title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="description" className="text-sm font-medium text-zinc-700">
                  Description <span className="text-zinc-400">(optional)</span>
                </label>
                <textarea
                  id="description"
                  placeholder="Describe your changes"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-zinc-900/5"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="secondary" onClick={() => setIsOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" isLoading={isLoading}>
                  Create pull request
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  )
}
