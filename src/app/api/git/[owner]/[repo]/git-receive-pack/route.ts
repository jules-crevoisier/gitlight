import { NextRequest, NextResponse } from 'next/server'
import { spawn } from 'child_process'
import { prisma } from '@/lib/db'
import { validateAccessToken } from '@/services/accessToken.service'
import { getRepoPath, repoExists } from '@/lib/git'
import { createAuditLog } from '@/lib/auditLog'

type RouteParams = {
  params: Promise<{
    owner: string
    repo: string
  }>
}

export const POST = async (request: NextRequest, { params }: RouteParams) => {
  const { owner, repo } = await params

  // Get repository
  const repository = await prisma.repository.findFirst({
    where: {
      name: repo,
      owner: { username: owner },
    },
  })

  if (!repository || !repoExists(owner, repo)) {
    return new NextResponse('Repository not found', { status: 404 })
  }

  // Always require authentication for push
  const authHeader = request.headers.get('authorization')

  if (!authHeader) {
    return new NextResponse('Authentication required', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="GitLight"',
      },
    })
  }

  const base64Credentials = authHeader.split(' ')[1]
  const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8')
  const [, token] = credentials.split(':')

  const authResult = await validateAccessToken(token)

  if (!authResult) {
    return new NextResponse('Invalid credentials', { status: 401 })
  }

  // Check write permission
  const hasWriteAccess =
    repository.ownerId === authResult.user.id ||
    authResult.scopes.includes('repo:write') ||
    authResult.scopes.includes('admin')

  // Check if user has write permission on this specific repo
  if (!hasWriteAccess) {
    const permission = await prisma.repoPermission.findFirst({
      where: {
        repoId: repository.id,
        userId: authResult.user.id,
        level: { in: ['WRITE', 'ADMIN'] },
      },
    })

    if (!permission) {
      return new NextResponse('Write access denied', { status: 403 })
    }
  }

  const repoPath = getRepoPath(owner, repo)
  const body = await request.arrayBuffer()

  return new Promise<NextResponse>((resolve) => {
    const proc = spawn('git', ['receive-pack', '--stateless-rpc', repoPath])

    const chunks: Buffer[] = []

    proc.stdout.on('data', (data) => {
      chunks.push(data)
    })

    proc.stderr.on('data', (data) => {
      console.error('Git receive-pack error:', data.toString())
    })

    proc.stdin.write(Buffer.from(body))
    proc.stdin.end()

    proc.on('close', async (code) => {
      if (code !== 0) {
        resolve(new NextResponse('Git error', { status: 500 }))
        return
      }

      // Log push operation
      await createAuditLog({
        userId: authResult.user.id,
        action: 'repo.push',
        resource: 'repository',
        resourceId: repository.id,
        ipAddress: request.headers.get('x-forwarded-for') || undefined,
      })

      // Update repository timestamp
      await prisma.repository.update({
        where: { id: repository.id },
        data: { updatedAt: new Date() },
      })

      const output = Buffer.concat(chunks)

      resolve(
        new NextResponse(output, {
          status: 200,
          headers: {
            'Content-Type': 'application/x-git-receive-pack-result',
            'Cache-Control': 'no-cache',
          },
        })
      )
    })
  })
}
