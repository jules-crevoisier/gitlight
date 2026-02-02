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

const updateSettingsSchema = z.object({
  description: z.string().max(500).optional(),
  isPublic: z.boolean().optional(),
})

export const PATCH = async (request: Request, { params }: RouteParams) => {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { owner, repo } = await params
    const body = await request.json()
    const updates = updateSettingsSchema.parse(body)

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

    const updatedRepo = await prisma.repository.update({
      where: { id: repository.id },
      data: {
        description: updates.description !== undefined ? updates.description : undefined,
        isPublic: updates.isPublic !== undefined ? updates.isPublic : undefined,
      },
    })

    return NextResponse.json({ repository: updatedRepo })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }

    console.error('Update settings error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
