import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { revokeAccessToken } from '@/services/accessToken.service'
import { createAuditLog } from '@/lib/auditLog'

type RouteParams = {
  params: Promise<{
    id: string
  }>
}

export const DELETE = async (_request: Request, { params }: RouteParams) => {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    await revokeAccessToken(session.user.id, id)

    await createAuditLog({
      userId: session.user.id,
      action: 'token.revoke',
      resource: 'access_token',
      resourceId: id,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    console.error('Revoke token error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
