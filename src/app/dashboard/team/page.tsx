import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import Link from 'next/link'
import { Icon } from '@/components/ui/Icon'
import { Avatar } from '@/components/ui/Avatar'

const TeamPage = async () => {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  const reposWithCollaborators = await prisma.repository.findMany({
    where: {
      OR: [
        { ownerId: session.user.id },
        { permissions: { some: { userId: session.user.id } } },
      ],
    },
    include: {
      owner: { select: { username: true } },
      permissions: {
        include: {
          user: { select: { username: true, email: true } },
        },
      },
    },
    orderBy: { updatedAt: 'desc' },
  })

  const reposWhereICollaborate = reposWithCollaborators.filter(
    (r) => r.ownerId !== session.user.id
  )
  const reposIOwn = reposWithCollaborators.filter((r) => r.ownerId === session.user.id)

  return (
    <>
      <div className="h-14 border-b border-zinc-200 flex items-center justify-between px-6 lg:px-8 bg-white shrink-0">
        <h1 className="text-lg font-medium text-zinc-900">Team</h1>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-6 lg:px-8 py-8 space-y-8">
          <div className="border border-zinc-200 rounded-lg bg-zinc-50/50 p-4">
            <p className="text-sm text-zinc-600">
              Manage collaborators per repository in{' '}
              <Link href="/dashboard/settings" className="text-zinc-900 font-medium underline">
                Settings
              </Link>
              . Here you see repositories where you collaborate.
            </p>
          </div>

          {reposWhereICollaborate.length > 0 ? (
            <section>
              <h2 className="text-sm font-medium text-zinc-700 mb-4">
                Repositories where I collaborate
              </h2>
              <div className="border border-zinc-200 rounded-lg overflow-hidden divide-y divide-zinc-100 bg-white">
                {reposWhereICollaborate.map((repo) => {
                  const myPermission = repo.permissions.find((p) => p.userId === session.user.id)
                  return (
                    <Link
                      key={repo.id}
                      href={`/${repo.owner.username}/${repo.name}`}
                      className="flex items-center justify-between px-4 py-3 hover:bg-zinc-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Icon name="solar:code-square-linear" size={20} className="text-zinc-400" />
                        <span className="text-sm font-medium text-zinc-900">
                          {repo.owner.username}/{repo.name}
                        </span>
                        <span className="text-xs text-zinc-500 capitalize">
                          {myPermission?.level.toLowerCase()}
                        </span>
                      </div>
                      <Link
                        href={`/${repo.owner.username}/${repo.name}/settings`}
                        className="text-xs text-zinc-500 hover:text-zinc-900"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Settings
                      </Link>
                    </Link>
                  )
                })}
              </div>
            </section>
          ) : null}

          <section>
            <h2 className="text-sm font-medium text-zinc-700 mb-4">My repositories & collaborators</h2>
            {reposIOwn.length === 0 ? (
              <div className="text-center py-12 border border-zinc-200 rounded-lg bg-zinc-50/50">
                <Icon name="solar:code-square-linear" size={48} className="text-zinc-300 mx-auto mb-4" />
                <p className="text-sm text-zinc-500">No repositories yet.</p>
                <Link href="/dashboard" className="text-sm text-zinc-900 font-medium mt-2 inline-block">
                  Create one
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {reposIOwn.map((repo) => (
                  <div
                    key={repo.id}
                    className="border border-zinc-200 rounded-lg overflow-hidden bg-white"
                  >
                    <div className="px-4 py-3 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
                      <Link
                        href={`/${repo.owner.username}/${repo.name}`}
                        className="text-sm font-medium text-zinc-900 hover:underline"
                      >
                        {repo.owner.username}/{repo.name}
                      </Link>
                      <Link
                        href={`/${repo.owner.username}/${repo.name}/settings`}
                        className="text-xs text-zinc-500 hover:text-zinc-900 flex items-center gap-1"
                      >
                        <Icon name="solar:settings-linear" size={14} />
                        Add collaborator
                      </Link>
                    </div>
                    {repo.permissions.length > 0 ? (
                      <div className="divide-y divide-zinc-100">
                        {repo.permissions.map((p) => (
                          <div
                            key={p.id}
                            className="px-4 py-2 flex items-center gap-3"
                          >
                            <Avatar name={p.user.username} size="sm" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-zinc-900">{p.user.username}</p>
                              <p className="text-xs text-zinc-500 truncate">{p.user.email}</p>
                            </div>
                            <span className="text-xs text-zinc-500 capitalize">{p.level.toLowerCase()}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="px-4 py-6 text-center text-sm text-zinc-500">
                        No collaborators. Add some in repository settings.
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </>
  )
}

export default TeamPage
