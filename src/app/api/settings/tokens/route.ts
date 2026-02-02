import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { createAccessToken, getAccessTokens } from '@/services/accessToken.service'
import { createAuditLog } from '@/lib/auditLog'
import { apiLimiter } from '@/lib/rateLimit'
import { z } from 'zod'

const createTokenSchema = z.object({
  name: z.string().min(1).max(100),
  scopes: z.array(z.enum(['repo:read', 'repo:write', 'user:read', 'admin'])).min(1),
  expiresInDays: z.number().min(1).max(365).optional(),
})

const getClientIp = (request: Request): string =>
  request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
  request.headers.get('x-real-ip') ||
  'unknown'

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
    const { name, scopes, expiresInDays } = createTokenSchema.parse(body)

    const token = await createAccessToken({
      userId: session.user.id,
      name,
      scopes,
      expiresInDays,
    })

    await createAuditLog({
      userId: session.user.id,
      action: 'token.create',
      resource: 'access_token',
      resourceId: token.id,
      metadata: { name, scopes },
    })

    return NextResponse.json({ token }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Create token error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export const GET = async () => {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tokens = await getAccessTokens(session.user.id)

    return NextResponse.json({ tokens })
  } catch (error) {
    console.error('Get tokens error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
