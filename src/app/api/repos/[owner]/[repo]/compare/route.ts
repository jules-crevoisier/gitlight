import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { repoExists, getRepoPath } from '@/lib/git'
import { execSync } from 'child_process'

type RouteParams = {
  params: Promise<{
    owner: string
    repo: string
  }>
}

export const GET = async (request: NextRequest, { params }: RouteParams) => {
  try {
    const { owner, repo } = await params
    const base = request.nextUrl.searchParams.get('base')
    const head = request.nextUrl.searchParams.get('head')

    if (!base || !head) {
      return NextResponse.json({ error: 'Missing base or head parameter' }, { status: 400 })
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

    const repoPath = getRepoPath(owner, repo)

    // Get commits ahead (in head but not in base)
    let ahead = 0
    try {
      const aheadResult = execSync(
        `git -C "${repoPath}" rev-list --count ${base}..${head}`,
        { encoding: 'utf-8', stdio: 'pipe' }
      ).trim()
      ahead = parseInt(aheadResult) || 0
    } catch {
      ahead = 0
    }

    // Get commits behind (in base but not in head)
    let behind = 0
    try {
      const behindResult = execSync(
        `git -C "${repoPath}" rev-list --count ${head}..${base}`,
        { encoding: 'utf-8', stdio: 'pipe' }
      ).trim()
      behind = parseInt(behindResult) || 0
    } catch {
      behind = 0
    }

    return NextResponse.json({ ahead, behind })
  } catch (error) {
    console.error('Compare error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
