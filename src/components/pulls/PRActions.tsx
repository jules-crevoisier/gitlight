'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { useToast } from '@/components/ui/Toast'

type PRActionsProps = {
  owner: string
  repo: string
  prNumber: number
}

export const PRActions = ({ owner, repo, prNumber }: PRActionsProps) => {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState<'merge' | 'close' | null>(null)

  const handleMerge = async () => {
    setIsLoading('merge')

    try {
      const res = await fetch(`/api/repos/${owner}/${repo}/pulls/${prNumber}/merge`, {
        method: 'POST',
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        toast('Pull request merged')
        router.refresh()
      } else {
        toast(data.error || 'Merge failed', 'error')
      }
    } catch {
      toast('An error occurred', 'error')
    } finally {
      setIsLoading(null)
    }
  }

  const handleClose = async () => {
    setIsLoading('close')

    try {
      const res = await fetch(`/api/repos/${owner}/${repo}/pulls/${prNumber}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CLOSED' }),
      })
      if (res.ok) {
        toast('Pull request closed')
        router.refresh()
      } else {
        toast('Failed to close', 'error')
      }
    } catch {
      toast('An error occurred', 'error')
    } finally {
      setIsLoading(null)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="primary"
        onClick={handleMerge}
        isLoading={isLoading === 'merge'}
        disabled={isLoading !== null}
      >
        <Icon name="solar:git-merge-linear" size={14} />
        Merge
      </Button>
      <Button
        variant="secondary"
        onClick={handleClose}
        isLoading={isLoading === 'close'}
        disabled={isLoading !== null}
      >
        <Icon name="solar:close-circle-linear" size={14} />
        Close
      </Button>
    </div>
  )
}
