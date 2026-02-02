import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { repoExists, getCommitFileDiff, getFileDiff } from '@/lib/git'

type RouteParams = {
  params: Promise<{
    owner: string
    repo: string
    sha: string
  }>
}

export const GET = async (request: NextRequest, { params }: RouteParams) => {
  try {
    const { owner, repo, sha } = await params
    const filePath = request.nextUrl.searchParams.get('file')
    const base = request.nextUrl.searchParams.get('base')
    const head = request.nextUrl.searchParams.get('head')

    if (!filePath) {
      return NextResponse.json({ error: 'File path required' }, { status: 400 })
    }

    const repository = await prisma.repository.findFirst({
      where: {
        name: repo,
        owner: { username: owner },
      },
    })

    if (!repository || !repoExists(owner, repo)) {
      return NextResponse.json({ error: 'Repository not found' }, { status: 404 })
    }

    let diff: string

    // If base and head are provided, use branch diff
    if (base && head && sha === 'compare') {
      diff = await getFileDiff(owner, repo, base, head, filePath)
    } else {
      // Otherwise, get commit diff
      diff = await getCommitFileDiff(owner, repo, sha, filePath)
    }

    return NextResponse.json({ diff })
  } catch (error) {
    console.error('Get diff error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
