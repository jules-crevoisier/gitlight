import { prisma } from './db'

export type AuditAction =
  | 'user.register'
  | 'user.login'
  | 'user.logout'
  | 'repo.create'
  | 'repo.delete'
  | 'repo.clone'
  | 'repo.push'
  | 'pr.create'
  | 'pr.merge'
  | 'pr.close'
  | 'pr.comment'
  | 'ssh_key.add'
  | 'ssh_key.remove'
  | 'token.create'
  | 'token.revoke'

export type AuditLogData = {
  userId?: string
  action: AuditAction
  resource: string
  resourceId?: string
  metadata?: Record<string, unknown>
  ipAddress?: string
}

export const createAuditLog = async (data: AuditLogData): Promise<void> => {
  try {
    await prisma.auditLog.create({
      data: {
        userId: data.userId || null,
        action: data.action,
        resource: data.resource,
        resourceId: data.resourceId || null,
        metadata: data.metadata || null,
        ipAddress: data.ipAddress || null,
      },
    })
  } catch (error) {
    // Don't throw - audit logging should not break the main flow
    console.error('Failed to create audit log:', error)
  }
}

export const getAuditLogs = async (options: {
  userId?: string
  resource?: string
  resourceId?: string
  action?: AuditAction
  limit?: number
  offset?: number
}) => {
  const where: Record<string, unknown> = {}

  if (options.userId) where.userId = options.userId
  if (options.resource) where.resource = options.resource
  if (options.resourceId) where.resourceId = options.resourceId
  if (options.action) where.action = options.action

  return prisma.auditLog.findMany({
    where,
    include: {
      user: {
        select: {
          username: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: options.limit || 50,
    skip: options.offset || 0,
  })
}
