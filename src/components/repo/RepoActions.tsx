'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { CloneModal } from './CloneModal'

type RepoActionsProps = {
  owner: string
  repo: string
  stars?: number
}

export const RepoActions = ({ owner, repo, stars = 0 }: RepoActionsProps) => {
  const [isCloneOpen, setIsCloneOpen] = useState(false)

  return (
    <>
      <Button variant="secondary" size="md">
        <Icon name="solar:star-linear" size={14} />
        Star
        {stars > 0 ? (
          <span className="ml-1 text-zinc-400 border-l border-zinc-200 pl-1.5">{stars}</span>
        ) : null}
      </Button>
      <Button size="md" onClick={() => setIsCloneOpen(true)}>
        <Icon name="solar:copy-linear" size={14} />
        Clone
      </Button>

      <CloneModal
        owner={owner}
        repo={repo}
        isOpen={isCloneOpen}
        onClose={() => setIsCloneOpen(false)}
      />
    </>
  )
}
