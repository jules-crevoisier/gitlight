import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { addSSHKey, getSSHKeys } from '@/services/sshKey.service'
import { createAuditLog } from '@/lib/auditLog'
import { z } from 'zod'

const addKeySchema = z.object({
  title: z.string().min(1).max(100),
  publicKey: z.string().min(20).max(10000),
})

export const POST = async (request: Request) => {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { title, publicKey } = addKeySchema.parse(body)

    const key = await addSSHKey({
      userId: session.user.id,
      title,
      publicKey,
    })

    await createAuditLog({
      userId: session.user.id,
      action: 'ssh_key.add',
      resource: 'ssh_key',
      resourceId: key.id,
      metadata: { title },
    })

    return NextResponse.json({ key }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    console.error('Add SSH key error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export const GET = async () => {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const keys = await getSSHKeys(session.user.id)

    return NextResponse.json({ keys })
  } catch (error) {
    console.error('Get SSH keys error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
