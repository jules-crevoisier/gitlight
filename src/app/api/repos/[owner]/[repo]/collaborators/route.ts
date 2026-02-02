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

const addCollaboratorSchema = z.object({
  username: z.string().min(1),
  level: z.enum(['READ', 'WRITE', 'ADMIN']),
})

export const POST = async (request: Request, { params }: RouteParams) => {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { owner, repo } = await params
    const body = await request.json()
    const { username, level } = addCollaboratorSchema.parse(body)

    const repository = await prisma.repository.findFirst({
      where: {
        name: repo,
        owner: { username: owner },
      },
    })

    if (!repository) {
      return NextResponse.json({ error: 'Repository not found' }, { status: 404 })
    }

    // Only owner or admin can add collaborators
    const isOwner = repository.ownerId === session.user.id
    const isAdmin = await prisma.repoPermission.findFirst({
      where: {
        repoId: repository.id,
        userId: session.user.id,
        level: 'ADMIN',
      },
    })

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Find user to add
    const userToAdd = await prisma.user.findUnique({
      where: { username },
    })

    if (!userToAdd) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (userToAdd.id === repository.ownerId) {
      return NextResponse.json({ error: 'Cannot add owner as collaborator' }, { status: 400 })
    }

    // Check if already a collaborator
    const existing = await prisma.repoPermission.findFirst({
      where: {
        repoId: repository.id,
        userId: userToAdd.id,
      },
    })

    if (existing) {
      // Update permission level
      const updated = await prisma.repoPermission.update({
        where: { id: existing.id },
        data: { level },
        include: {
          user: { select: { username: true, email: true } },
        },
      })
      return NextResponse.json({ permission: updated })
    }

    // Create new permission
    const permission = await prisma.repoPermission.create({
      data: {
        repoId: repository.id,
        userId: userToAdd.id,
        level,
      },
      include: {
        user: { select: { username: true, email: true } },
      },
    })

    return NextResponse.json({ permission }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }

    console.error('Add collaborator error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
