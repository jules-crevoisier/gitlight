import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { deleteRepo } from '@/lib/git'
import { createAuditLog } from '@/lib/auditLog'

type RouteParams = {
  params: Promise<{
    owner: string
    repo: string
  }>
}

export const DELETE = async (_request: Request, { params }: RouteParams) => {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { owner, repo } = await params

    const repository = await prisma.repository.findFirst({
      where: {
        name: repo,
        owner: { username: owner },
      },
    })

    if (!repository) {
      return NextResponse.json({ error: 'Repository not found' }, { status: 404 })
    }

    if (repository.ownerId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Delete from database (cascades to permissions, PRs, comments)
    await prisma.repository.delete({
      where: { id: repository.id },
    })

    // Delete git repository from filesystem
    await deleteRepo(owner, repo)

    // Log deletion
    await createAuditLog({
      userId: session.user.id,
      action: 'repo.delete',
      resource: 'repository',
      resourceId: repository.id,
      metadata: { name: repo, owner },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete repo error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
