import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

type RouteParams = {
  params: Promise<{
    owner: string
    repo: string
    id: string
  }>
}

const updatePRSchema = z.object({
  status: z.enum(['OPEN', 'CLOSED']).optional(),
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(5000).optional(),
})

export const PATCH = async (request: Request, { params }: RouteParams) => {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { owner, repo, id } = await params
    const prNumber = parseInt(id)
    const body = await request.json()
    const updates = updatePRSchema.parse(body)

    // Get repository
    const repository = await prisma.repository.findFirst({
      where: {
        name: repo,
        owner: { username: owner },
      },
    })

    if (!repository) {
      return NextResponse.json({ error: 'Repository not found' }, { status: 404 })
    }

    // Get PR
    const pullRequest = await prisma.pullRequest.findFirst({
      where: {
        repoId: repository.id,
        number: prNumber,
      },
    })

    if (!pullRequest) {
      return NextResponse.json({ error: 'Pull request not found' }, { status: 404 })
    }

    // Check permission (owner or PR author)
    if (repository.ownerId !== session.user.id && pullRequest.authorId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Update PR
    const updatedPR = await prisma.pullRequest.update({
      where: { id: pullRequest.id },
      data: updates,
    })

    return NextResponse.json({ pullRequest: updatedPR })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Update PR error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
