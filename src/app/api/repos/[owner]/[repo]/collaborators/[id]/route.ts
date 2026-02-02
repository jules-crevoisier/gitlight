import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'

type RouteParams = {
  params: Promise<{
    owner: string
    repo: string
    id: string
  }>
}

export const DELETE = async (_request: Request, { params }: RouteParams) => {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { owner, repo, id } = await params

    const repository = await prisma.repository.findFirst({
      where: {
        name: repo,
        owner: { username: owner },
      },
    })

    if (!repository) {
      return NextResponse.json({ error: 'Repository not found' }, { status: 404 })
    }

    // Only owner or admin can remove collaborators
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

    // Find and delete permission
    const permission = await prisma.repoPermission.findFirst({
      where: {
        id,
        repoId: repository.id,
      },
    })

    if (!permission) {
      return NextResponse.json({ error: 'Collaborator not found' }, { status: 404 })
    }

    await prisma.repoPermission.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Remove collaborator error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
