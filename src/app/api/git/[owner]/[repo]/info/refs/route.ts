import { NextRequest, NextResponse } from 'next/server'
import { spawn } from 'child_process'
import { prisma } from '@/lib/db'
import { validateAccessToken } from '@/services/accessToken.service'
import { getRepoPath, repoExists } from '@/lib/git'

type RouteParams = {
  params: Promise<{
    owner: string
    repo: string
  }>
}

export const GET = async (request: NextRequest, { params }: RouteParams) => {
  const { owner, repo } = await params
  const service = request.nextUrl.searchParams.get('service')

  if (!service || !['git-upload-pack', 'git-receive-pack'].includes(service)) {
    return new NextResponse('Invalid service', { status: 400 })
  }

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

  // Check authentication for private repos or push operations
  if (!repository.isPublic || service === 'git-receive-pack') {
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader) {
      return new NextResponse('Authentication required', {
        status: 401,
        headers: {
          'WWW-Authenticate': 'Basic realm="GitLight"',
        },
      })
    }

    // Parse Basic auth (username:token)
    const parts = authHeader.split(' ')
    if (parts.length !== 2 || parts[0] !== 'Basic') {
      console.log('Invalid auth header format:', authHeader)
      return new NextResponse('Invalid authorization header', { status: 401 })
    }

    const base64Credentials = parts[1]
    const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8')
    const colonIndex = credentials.indexOf(':')
    
    if (colonIndex === -1) {
      console.log('No colon in credentials')
      return new NextResponse('Invalid credentials format', { status: 401 })
    }

    const username = credentials.substring(0, colonIndex)
    const token = credentials.substring(colonIndex + 1)

    console.log(`Git auth attempt: user=${username}, token_prefix=${token.substring(0, 10)}...`)

    const authResult = await validateAccessToken(token)
    
    if (!authResult) {
      console.log('Token validation failed')
      return new NextResponse('Invalid credentials', { status: 401 })
    }

    console.log(`Auth successful: user=${authResult.user.username}, scopes=${authResult.scopes.join(',')}`)

    // Check write permission for push
    if (service === 'git-receive-pack') {
      const hasWriteAccess =
        repository.ownerId === authResult.user.id ||
        authResult.scopes.includes('repo:write') ||
        authResult.scopes.includes('admin')

      if (!hasWriteAccess) {
        // Check repo permissions
        const permission = await prisma.repoPermission.findFirst({
          where: {
            repoId: repository.id,
            userId: authResult.user.id,
            level: { in: ['WRITE', 'ADMIN'] },
          },
        })

        if (!permission) {
          console.log('Write access denied for user:', authResult.user.username)
          return new NextResponse('Write access denied', { status: 403 })
        }
      }
    }
  }

  const repoPath = getRepoPath(owner, repo)
  const serviceName = service.replace('git-', '')

  return new Promise<NextResponse>((resolve) => {
    const proc = spawn('git', [serviceName, '--stateless-rpc', '--advertise-refs', repoPath])

    const chunks: Buffer[] = []

    proc.stdout.on('data', (data) => {
      chunks.push(data)
    })

    proc.stderr.on('data', (data) => {
      console.error('Git error:', data.toString())
    })

    proc.on('close', (code) => {
      if (code !== 0) {
        resolve(new NextResponse('Git error', { status: 500 }))
        return
      }

      const output = Buffer.concat(chunks)
      const packet = `# service=${service}\n`
      const packetLine = `${(packet.length + 4).toString(16).padStart(4, '0')}${packet}`
      const body = Buffer.concat([Buffer.from(packetLine + '0000'), output])

      resolve(
        new NextResponse(body, {
          status: 200,
          headers: {
            'Content-Type': `application/x-${service}-advertisement`,
            'Cache-Control': 'no-cache',
          },
        })
      )
    })
  })
}
