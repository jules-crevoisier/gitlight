import { prisma } from '@/lib/db'
import { createHash } from 'crypto'

export type SSHKeyInput = {
  userId: string
  title: string
  publicKey: string
}

const generateFingerprint = (publicKey: string): string => {
  // Remove the key type prefix and comment suffix
  const parts = publicKey.trim().split(' ')
  const keyData = parts.length >= 2 ? parts[1] : parts[0]

  // Decode base64 and hash
  const buffer = Buffer.from(keyData, 'base64')
  const hash = createHash('sha256').update(buffer).digest('base64')

  return `SHA256:${hash.replace(/=+$/, '')}`
}

const validateSSHKey = (publicKey: string): boolean => {
  // Basic validation - check if it looks like an SSH key
  const keyTypes = ['ssh-rsa', 'ssh-ed25519', 'ecdsa-sha2-nistp256', 'ecdsa-sha2-nistp384', 'ecdsa-sha2-nistp521']
  const trimmed = publicKey.trim()

  return keyTypes.some((type) => trimmed.startsWith(type))
}

export const addSSHKey = async (input: SSHKeyInput) => {
  const publicKey = input.publicKey.trim()

  if (!validateSSHKey(publicKey)) {
    throw new Error('Invalid SSH key format')
  }

  const fingerprint = generateFingerprint(publicKey)

  // Check if key already exists
  const existingKey = await prisma.sSHKey.findUnique({
    where: { fingerprint },
  })

  if (existingKey) {
    throw new Error('SSH key already exists')
  }

  // Create the key
  const sshKey = await prisma.sSHKey.create({
    data: {
      userId: input.userId,
      title: input.title,
      publicKey,
      fingerprint,
    },
  })

  return sshKey
}

export const removeSSHKey = async (userId: string, keyId: string) => {
  const key = await prisma.sSHKey.findFirst({
    where: {
      id: keyId,
      userId,
    },
  })

  if (!key) {
    throw new Error('SSH key not found')
  }

  await prisma.sSHKey.delete({
    where: { id: keyId },
  })

  return true
}

export const getSSHKeys = async (userId: string) => {
  return prisma.sSHKey.findMany({
    where: { userId },
    select: {
      id: true,
      title: true,
      fingerprint: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  })
}

export const findUserBySSHKey = async (publicKey: string) => {
  const fingerprint = generateFingerprint(publicKey.trim())

  const key = await prisma.sSHKey.findUnique({
    where: { fingerprint },
    include: {
      user: {
        select: {
          id: true,
          username: true,
        },
      },
    },
  })

  return key?.user || null
}
