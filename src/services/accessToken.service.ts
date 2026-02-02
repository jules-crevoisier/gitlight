import { prisma } from '@/lib/db'
import { randomBytes, createHash } from 'crypto'

export type TokenScope = 'repo:read' | 'repo:write' | 'user:read' | 'admin'

export type CreateTokenInput = {
  userId: string
  name: string
  scopes: TokenScope[]
  expiresInDays?: number
}

const generateToken = (): { token: string; hash: string } => {
  const token = `gl_${randomBytes(32).toString('hex')}`
  const hash = createHash('sha256').update(token).digest('hex')
  return { token, hash }
}

export const createAccessToken = async (input: CreateTokenInput) => {
  const { token, hash } = generateToken()

  const expiresAt = input.expiresInDays
    ? new Date(Date.now() + input.expiresInDays * 24 * 60 * 60 * 1000)
    : null

  const accessToken = await prisma.accessToken.create({
    data: {
      userId: input.userId,
      name: input.name,
      tokenHash: hash,
      scopes: input.scopes,
      expiresAt,
    },
    select: {
      id: true,
      name: true,
      scopes: true,
      expiresAt: true,
      createdAt: true,
    },
  })

  // Return the token only once - it can't be retrieved later
  return {
    ...accessToken,
    token,
  }
}

export const validateAccessToken = async (token: string) => {
  if (!token.startsWith('gl_')) {
    return null
  }

  const hash = createHash('sha256').update(token).digest('hex')

  const accessToken = await prisma.accessToken.findUnique({
    where: { tokenHash: hash },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          email: true,
        },
      },
    },
  })

  if (!accessToken) {
    return null
  }

  // Check expiration
  if (accessToken.expiresAt && accessToken.expiresAt < new Date()) {
    return null
  }

  // Update last used
  await prisma.accessToken.update({
    where: { id: accessToken.id },
    data: { lastUsed: new Date() },
  })

  return {
    user: accessToken.user,
    scopes: accessToken.scopes,
  }
}

export const revokeAccessToken = async (userId: string, tokenId: string) => {
  const token = await prisma.accessToken.findFirst({
    where: {
      id: tokenId,
      userId,
    },
  })

  if (!token) {
    throw new Error('Token not found')
  }

  await prisma.accessToken.delete({
    where: { id: tokenId },
  })

  return true
}

export const getAccessTokens = async (userId: string) => {
  return prisma.accessToken.findMany({
    where: { userId },
    select: {
      id: true,
      name: true,
      scopes: true,
      expiresAt: true,
      createdAt: true,
      lastUsed: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  })
}
