'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Icon } from '@/components/ui/Icon'

type DangerZoneProps = {
  repoId: string
  owner: string
  repo: string
}

export const DangerZone = ({ repoId, owner, repo }: DangerZoneProps) => {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  const [confirmName, setConfirmName] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleDelete = async () => {
    if (confirmName !== repo) return

    setIsLoading(true)

    try {
      const res = await fetch(`/api/repos/${owner}/${repo}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        router.push('/dashboard')
        router.refresh()
      }
    } catch {
      // Handle error
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="border border-red-200 rounded-lg bg-red-50/50 overflow-hidden">
      <div className="p-4">
        <h3 className="text-sm font-medium text-red-800 mb-1">Delete this repository</h3>
        <p className="text-xs text-red-600">
          Once you delete a repository, there is no going back. Please be certain.
        </p>
      </div>

      {isDeleting ? (
        <div className="p-4 border-t border-red-200 bg-white space-y-4">
          <div className="bg-red-100 border border-red-200 rounded-md p-3">
            <p className="text-sm text-red-800">
              This will permanently delete the <strong>{owner}/{repo}</strong> repository,
              including all commits, branches, pull requests, and collaborators.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-700">
              Type <strong>{repo}</strong> to confirm
            </label>
            <Input
              value={confirmName}
              onChange={(e) => setConfirmName(e.target.value)}
              placeholder={repo}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setIsDeleting(false)
                setConfirmName('')
              }}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              isLoading={isLoading}
              disabled={confirmName !== repo}
            >
              <Icon name="solar:trash-bin-minimalistic-linear" size={14} />
              Delete repository
            </Button>
          </div>
        </div>
      ) : (
        <div className="p-4 border-t border-red-200 bg-white">
          <Button variant="danger" onClick={() => setIsDeleting(true)}>
            <Icon name="solar:trash-bin-minimalistic-linear" size={14} />
            Delete this repository
          </Button>
        </div>
      )}
    </div>
  )
}
