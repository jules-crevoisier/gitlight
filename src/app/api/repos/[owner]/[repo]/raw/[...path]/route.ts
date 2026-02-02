import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { repoExists, getFileContent } from '@/lib/git'

type RouteParams = {
  params: Promise<{
    owner: string
    repo: string
    path: string[]
  }>
}

export const GET = async (_request: NextRequest, { params }: RouteParams) => {
  try {
    const { owner, repo, path: pathSegments } = await params
    const branch = pathSegments[0]
    const filePath = pathSegments.slice(1).join('/')

    const repository = await prisma.repository.findFirst({
      where: {
        name: repo,
        owner: { username: owner },
      },
    })

    if (!repository || !repoExists(owner, repo)) {
      return new NextResponse('Not found', { status: 404 })
    }

    const content = await getFileContent(owner, repo, branch, filePath)

    if (!content) {
      return new NextResponse('File not found', { status: 404 })
    }

    // Determine content type
    const ext = filePath.split('.').pop()?.toLowerCase()
    let contentType = 'text/plain'

    const mimeTypes: Record<string, string> = {
      js: 'application/javascript',
      ts: 'application/typescript',
      json: 'application/json',
      html: 'text/html',
      css: 'text/css',
      md: 'text/markdown',
      xml: 'application/xml',
      svg: 'image/svg+xml',
      png: 'image/png',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      gif: 'image/gif',
      webp: 'image/webp',
      pdf: 'application/pdf',
    }

    if (ext && mimeTypes[ext]) {
      contentType = mimeTypes[ext]
    }

    if (content.isBinary) {
      return new NextResponse(Buffer.from(content.content, 'base64'), {
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `inline; filename="${filePath.split('/').pop()}"`,
        },
      })
    }

    return new NextResponse(content.content, {
      headers: {
        'Content-Type': `${contentType}; charset=utf-8`,
      },
    })
  } catch (error) {
    console.error('Raw file error:', error)
    return new NextResponse('Internal server error', { status: 500 })
  }
}
