import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { repoExists, searchCode } from '@/lib/git'

type RouteParams = {
  params: Promise<{ owner: string; repo: string }>
}

export const GET = async (request: NextRequest, { params }: RouteParams) => {
  try {
    const { owner, repo } = await params
    const q = request.nextUrl.searchParams.get('q')
    const ref = request.nextUrl.searchParams.get('ref') || 'HEAD'

    if (!q || q.length < 2) {
      return NextResponse.json({ error: 'Query too short' }, { status: 400 })
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

    const results = await searchCode(owner, repo, q, ref)

    return NextResponse.json({ results })
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
