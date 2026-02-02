import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

type RouteParams = {
  params: Promise<{
    owner: string
    repo: string
  }>
}

const createPRSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(5000).optional(),
  sourceBranch: z.string().min(1),
  targetBranch: z.string().min(1),
})

export const POST = async (request: Request, { params }: RouteParams) => {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { owner, repo } = await params
    const body = await request.json()
    const { title, description, sourceBranch, targetBranch } = createPRSchema.parse(body)

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

    // Get next PR number
    const lastPR = await prisma.pullRequest.findFirst({
      where: { repoId: repository.id },
      orderBy: { number: 'desc' },
    })

    const number = (lastPR?.number || 0) + 1

    // Create pull request
    const pullRequest = await prisma.pullRequest.create({
      data: {
        number,
        title,
        description: description || null,
        sourceBranch,
        targetBranch,
        repoId: repository.id,
        authorId: session.user.id,
      },
      include: {
        author: {
          select: { username: true },
        },
      },
    })

    return NextResponse.json({ pullRequest }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Create PR error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
