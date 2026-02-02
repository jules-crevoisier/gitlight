import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getBranches, getDefaultBranch, repoExists } from '@/lib/git'

type RouteParams = {
  params: Promise<{
    owner: string
    repo: string
  }>
}

export const GET = async (_request: Request, { params }: RouteParams) => {
  try {
    const { owner, repo } = await params

    // Verify repository exists in database
    const repository = await prisma.repository.findFirst({
      where: {
        name: repo,
        owner: { username: owner },
      },
    })

    if (!repository) {
      return NextResponse.json({ error: 'Repository not found' }, { status: 404 })
    }

    if (!repoExists(owner, repo)) {
      return NextResponse.json({ branches: [] })
    }

    const defaultBranch = await getDefaultBranch(owner, repo)
    const branchInfos = await getBranches(owner, repo)
    const branches = branchInfos.map((b) => ({
      name: b.name,
      isDefault: b.name === defaultBranch,
    }))

    return NextResponse.json({ branches })
  } catch (error) {
    console.error('Get branches error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
