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

const createCommentSchema = z.object({
  content: z.string().min(1).max(10000),
  lineNumber: z.number().optional(),
  filePath: z.string().optional(),
})

export const POST = async (request: Request, { params }: RouteParams) => {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { owner, repo, id } = await params
    const prNumber = parseInt(id)
    const body = await request.json()
    const { content, lineNumber, filePath } = createCommentSchema.parse(body)

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

    // Create comment
    const comment = await prisma.comment.create({
      data: {
        content,
        lineNumber: lineNumber || null,
        filePath: filePath || null,
        prId: pullRequest.id,
        authorId: session.user.id,
      },
      include: {
        author: {
          select: { username: true },
        },
      },
    })

    return NextResponse.json({ comment }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Create comment error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
