import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { createBareRepo } from '@/lib/git'
import { apiLimiter } from '@/lib/rateLimit'
import { z } from 'zod'

const createRepoSchema = z.object({
  name: z.string().min(1).max(100).regex(/^[a-z0-9-_]+$/),
  description: z.string().max(500).optional(),
  isPublic: z.boolean().default(true),
})

const getClientIp = (request: Request): string => {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
}

export const POST = async (request: Request) => {
  try {
    const ip = getClientIp(request)
    const limit = apiLimiter(ip)
    if (!limit.allowed) {
      return NextResponse.json(
        { error: 'Too many requests', retryAfter: limit.retryAfter },
        { status: 429, headers: { 'Retry-After': String(limit.retryAfter ?? 60) } }
      )
    }

    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, isPublic } = createRepoSchema.parse(body)

    // Check if repo exists
    const existingRepo = await prisma.repository.findFirst({
      where: {
        ownerId: session.user.id,
        name,
      },
    })

    if (existingRepo) {
      return NextResponse.json(
        { error: 'Repository already exists' },
        { status: 400 }
      )
    }

    // Get user info for username (in case session doesn't have it)
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { username: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Create database entry
    const repo = await prisma.repository.create({
      data: {
        name,
        description: description || null,
        isPublic,
        ownerId: session.user.id,
      },
      include: {
        owner: {
          select: {
            username: true,
          },
        },
      },
    })

    // Create bare Git repository on filesystem
    try {
      await createBareRepo(user.username, name)
    } catch (gitError) {
      // Rollback: delete the database entry if git repo creation fails
      await prisma.repository.delete({ where: { id: repo.id } })
      console.error('Git repo creation error:', gitError)
      return NextResponse.json(
        { error: 'Failed to create git repository' },
        { status: 500 }
      )
    }

    return NextResponse.json({ repo }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Create repo error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export const GET = async () => {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const repositories = await prisma.repository.findMany({
      where: {
        OR: [
          { ownerId: session.user.id },
          {
            permissions: {
              some: {
                userId: session.user.id,
              },
            },
          },
        ],
      },
      include: {
        owner: {
          select: {
            username: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    })

    return NextResponse.json({ repositories })
  } catch (error) {
    console.error('Get repos error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
