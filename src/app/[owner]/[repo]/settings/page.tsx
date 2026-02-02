import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { notFound, redirect } from 'next/navigation'
import { Breadcrumbs } from '@/components/layout/Breadcrumbs'
import { RepoSettingsForm } from '@/components/repo/RepoSettingsForm'
import { CollaboratorsList } from '@/components/repo/CollaboratorsList'
import { DangerZone } from '@/components/repo/DangerZone'
import { Icon } from '@/components/ui/Icon'

type RepoSettingsPageProps = {
  params: Promise<{
    owner: string
    repo: string
  }>
}

const RepoSettingsPage = async ({ params }: RepoSettingsPageProps) => {
  const { owner, repo } = await params
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  const repository = await prisma.repository.findFirst({
    where: {
      name: repo,
      owner: { username: owner },
    },
    include: {
      owner: { select: { id: true, username: true } },
      permissions: {
        include: {
          user: { select: { id: true, username: true, email: true } },
        },
      },
    },
  })

  if (!repository) {
    notFound()
  }

  // Only owner can access settings
  if (repository.ownerId !== session.user.id) {
    notFound()
  }

  return (
    <>
      <Breadcrumbs
        items={[
          { label: owner, href: '/dashboard' },
          { label: repo, href: `/${owner}/${repo}` },
          { label: 'Settings' },
        ]}
        isPublic={repository.isPublic}
      />

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-6 lg:px-8 py-8 space-y-8">
          {/* General Settings */}
          <section>
            <h2 className="text-sm font-medium text-zinc-900 mb-4 flex items-center gap-2">
              <Icon name="solar:settings-linear" size={16} />
              General
            </h2>
            <RepoSettingsForm
              repoId={repository.id}
              name={repository.name}
              description={repository.description || ''}
              isPublic={repository.isPublic}
              owner={owner}
            />
          </section>

          {/* Collaborators */}
          <section>
            <h2 className="text-sm font-medium text-zinc-900 mb-4 flex items-center gap-2">
              <Icon name="solar:users-group-rounded-linear" size={16} />
              Collaborators
            </h2>
            <CollaboratorsList
              repoId={repository.id}
              owner={owner}
              repo={repo}
              collaborators={repository.permissions.map((p) => ({
                id: p.id,
                userId: p.userId,
                username: p.user.username,
                email: p.user.email,
                level: p.level,
              }))}
            />
          </section>

          {/* Danger Zone */}
          <section>
            <h2 className="text-sm font-medium text-red-600 mb-4 flex items-center gap-2">
              <Icon name="solar:danger-triangle-linear" size={16} />
              Danger Zone
            </h2>
            <DangerZone repoId={repository.id} owner={owner} repo={repo} />
          </section>
        </div>
      </div>
    </>
  )
}

export default RepoSettingsPage
