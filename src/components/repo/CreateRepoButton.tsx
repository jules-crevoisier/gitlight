'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Icon } from '@/components/ui/Icon'
import { useToast } from '@/components/ui/Toast'

export const CreateRepoButton = () => {
  const router = useRouter()
  const { toast } = useToast()
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false)
    }
    if (isOpen) {
      document.addEventListener('keydown', handleEsc)
      return () => document.removeEventListener('keydown', handleEsc)
    }
  }, [isOpen])
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isPublic, setIsPublic] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const res = await fetch('/api/repos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, isPublic }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to create repository')
        toast(data.error || 'Failed to create repository', 'error')
        return
      }

      setIsOpen(false)
      setName('')
      setDescription('')
      toast('Repository created')
      router.refresh()
      router.push(`/${data.repo.owner.username}/${data.repo.name}`)
    } catch {
      setError('An error occurred')
      toast('An error occurred', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>
        <Icon name="solar:add-circle-linear" size={14} />
        New
      </Button>

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
            aria-label="Close"
          />
          <div className="relative bg-white rounded-lg border border-zinc-200 shadow-xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-zinc-900">Create repository</h2>
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

              <div className="space-y-1.5">
                <label htmlFor="name" className="text-sm font-medium text-zinc-700">
                  Repository name
                </label>
                <Input
                  id="name"
                  type="text"
                  placeholder="my-awesome-project"
                  value={name}
                  onChange={(e) => setName(e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, ''))}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="description" className="text-sm font-medium text-zinc-700">
                  Description <span className="text-zinc-400">(optional)</span>
                </label>
                <Input
                  id="description"
                  type="text"
                  placeholder="A short description of your repository"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium text-zinc-700">Visibility</label>
                <div className="space-y-2">
                  <label className="flex items-start gap-3 p-3 border border-zinc-200 rounded-md cursor-pointer hover:bg-zinc-50 transition-colors">
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
                      <p className="text-xs text-zinc-500 mt-0.5">
                        Anyone can see this repository
                      </p>
                    </div>
                  </label>
                  <label className="flex items-start gap-3 p-3 border border-zinc-200 rounded-md cursor-pointer hover:bg-zinc-50 transition-colors">
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
                      <p className="text-xs text-zinc-500 mt-0.5">
                        Only you and collaborators can see
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setIsOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" isLoading={isLoading}>
                  Create repository
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  )
}
