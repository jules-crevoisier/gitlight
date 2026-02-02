'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Icon } from '@/components/ui/Icon'

type RepoSettingsFormProps = {
  repoId: string
  name: string
  description: string
  isPublic: boolean
  owner: string
}

export const RepoSettingsForm = ({
  repoId,
  name,
  description: initialDescription,
  isPublic: initialIsPublic,
  owner,
}: RepoSettingsFormProps) => {
  const router = useRouter()
  const [description, setDescription] = useState(initialDescription)
  const [isPublic, setIsPublic] = useState(initialIsPublic)
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setSuccess(false)

    try {
      const res = await fetch(`/api/repos/${owner}/${name}/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description, isPublic }),
      })

      if (res.ok) {
        setSuccess(true)
        router.refresh()
        setTimeout(() => setSuccess(false), 3000)
      }
    } catch {
      // Handle error
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="border border-zinc-200 rounded-lg p-4 bg-white space-y-4">
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-zinc-700">Repository name</label>
        <Input value={name} disabled className="bg-zinc-50" />
        <p className="text-xs text-zinc-500">Repository names cannot be changed.</p>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-zinc-700">Description</label>
        <Input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Short description of your repository"
        />
      </div>

      <div className="space-y-3">
        <label className="text-sm font-medium text-zinc-700">Visibility</label>
        <div className="space-y-2">
          <label className="flex items-start gap-3 p-3 border border-zinc-200 rounded-md cursor-pointer hover:bg-zinc-50">
            <input
              type="radio"
              name="visibility"
              checked={isPublic}
              onChange={() => setIsPublic(true)}
              className="mt-0.5"
            />
            <div>
              <div className="flex items-center gap-2">
                <Icon name="solar:global-linear" size={16} className="text-zinc-600" />
                <span className="text-sm font-medium text-zinc-900">Public</span>
              </div>
              <p className="text-xs text-zinc-500 mt-0.5">Anyone can see this repository</p>
            </div>
          </label>
          <label className="flex items-start gap-3 p-3 border border-zinc-200 rounded-md cursor-pointer hover:bg-zinc-50">
            <input
              type="radio"
              name="visibility"
              checked={!isPublic}
              onChange={() => setIsPublic(false)}
              className="mt-0.5"
            />
            <div>
              <div className="flex items-center gap-2">
                <Icon name="solar:lock-linear" size={16} className="text-zinc-600" />
                <span className="text-sm font-medium text-zinc-900">Private</span>
              </div>
              <p className="text-xs text-zinc-500 mt-0.5">Only you and collaborators can see</p>
            </div>
          </label>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2">
        {success ? (
          <span className="text-sm text-emerald-600 flex items-center gap-1">
            <Icon name="solar:check-circle-linear" size={14} />
            Settings saved
          </span>
        ) : (
          <span />
        )}
        <Button type="submit" isLoading={isLoading}>
          Save changes
        </Button>
      </div>
    </form>
  )
}
