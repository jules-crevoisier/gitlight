import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { repoExists, mergeBranches } from '@/lib/git'

type RouteParams = {
  params: Promise<{
    owner: string
    repo: string
    id: string
  }>
}

export const POST = async (_request: Request, { params }: RouteParams) => {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { owner, repo, id } = await params
    const prNumber = parseInt(id)

    // Get repository
    const repository = await prisma.repository.findFirst({
      where: {
        name: repo,
        owner: { username: owner },
      },
    })

    if (!repository) {
      return NextResponse.json({ error: 'Repository not found' }, { status: 404 })
    }

    // Get PR with author info
    const pullRequest = await prisma.pullRequest.findFirst({
      where: {
        repoId: repository.id,
        number: prNumber,
      },
      include: {
        author: { select: { username: true } },
      },
    })

    if (!pullRequest) {
      return NextResponse.json({ error: 'Pull request not found' }, { status: 404 })
    }

    if (pullRequest.status !== 'OPEN') {
      return NextResponse.json({ error: 'Pull request is not open' }, { status: 400 })
    }

    // Check permission (owner or PR author)
    if (repository.ownerId !== session.user.id && pullRequest.authorId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Check if git repo exists
    if (!repoExists(owner, repo)) {
      return NextResponse.json({ error: 'Git repository not found' }, { status: 404 })
    }

    // Perform merge
    const mergeResult = await mergeBranches(
      owner,
      repo,
      pullRequest.sourceBranch,
      pullRequest.targetBranch,
      `Merge pull request #${pullRequest.number} from ${pullRequest.sourceBranch}\n\n${pullRequest.title}`
    )

    if (!mergeResult.success) {
      console.error('Git merge error:', mergeResult.error)
      return NextResponse.json({ 
        error: mergeResult.error || 'Merge failed' 
      }, { status: 409 })
    }

    // Update PR status
    const updatedPR = await prisma.pullRequest.update({
      where: { id: pullRequest.id },
      data: {
        status: 'MERGED',
        mergedAt: new Date(),
      },
    })

    return NextResponse.json({ pullRequest: updatedPR })
  } catch (error) {
    console.error('Merge PR error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
