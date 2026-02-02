'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { formatRelativeTime } from '@/lib/utils'

type Comment = {
  id: string
  content: string
  createdAt: Date
  author: {
    username: string
  }
}

type CommentSectionProps = {
  comments: Comment[]
  prId: string
  owner: string
  repo: string
  prNumber: number
  isLoggedIn: boolean
}

export const CommentSection = ({
  comments,
  prId,
  owner,
  repo,
  prNumber,
  isLoggedIn,
}: CommentSectionProps) => {
  const router = useRouter()
  const [content, setContent] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return

    setIsLoading(true)

    try {
      const res = await fetch(`/api/repos/${owner}/${repo}/pulls/${prNumber}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })

      if (res.ok) {
        setContent('')
        router.refresh()
      }
    } catch {
      // Handle error
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      <h2 className="text-sm font-medium text-zinc-700 mb-4">
        Comments ({comments.length})
      </h2>

      {/* Comments List */}
      <div className="space-y-4 mb-6">
        {comments.map((comment) => (
          <div
            key={comment.id}
            className="border border-zinc-200 rounded-lg overflow-hidden"
          >
            <div className="bg-zinc-50 px-4 py-2 flex items-center gap-2 border-b border-zinc-200">
              <Avatar name={comment.author.username} size="sm" />
              <span className="text-sm font-medium text-zinc-700">
                {comment.author.username}
              </span>
              <span className="text-xs text-zinc-500">
                commented {formatRelativeTime(comment.createdAt)}
              </span>
            </div>
            <div className="p-4">
              <p className="text-sm text-zinc-700 whitespace-pre-wrap">{comment.content}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Add Comment */}
      {isLoggedIn ? (
        <form onSubmit={handleSubmit} className="border border-zinc-200 rounded-lg overflow-hidden">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Leave a comment"
            rows={3}
            className="w-full px-4 py-3 text-sm resize-none focus:outline-none"
          />
          <div className="bg-zinc-50 px-4 py-2 flex justify-end border-t border-zinc-200">
            <Button type="submit" size="sm" isLoading={isLoading} disabled={!content.trim()}>
              Comment
            </Button>
          </div>
        </form>
      ) : (
        <div className="text-center py-6 border border-zinc-200 rounded-lg bg-zinc-50/50">
          <p className="text-sm text-zinc-500">Sign in to leave a comment</p>
        </div>
      )}
    </div>
  )
}
