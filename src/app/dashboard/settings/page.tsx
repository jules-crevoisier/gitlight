import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { getSSHKeys } from '@/services/sshKey.service'
import { getAccessTokens } from '@/services/accessToken.service'
import { SSHKeyList } from '@/components/settings/SSHKeyList'
import { AccessTokenList } from '@/components/settings/AccessTokenList'
import { Icon } from '@/components/ui/Icon'

const SettingsPage = async () => {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  const [sshKeys, accessTokens] = await Promise.all([
    getSSHKeys(session.user.id),
    getAccessTokens(session.user.id),
  ])

  return (
    <>
      {/* Header */}
      <div className="h-14 border-b border-zinc-200 flex items-center justify-between px-6 lg:px-8 bg-white shrink-0">
        <h1 className="text-lg font-medium text-zinc-900">Settings</h1>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-6 lg:px-8 py-8 space-y-8">
          {/* Profile Section */}
          <section>
            <h2 className="text-sm font-medium text-zinc-900 mb-4 flex items-center gap-2">
              <Icon name="solar:user-linear" size={16} />
              Profile
            </h2>
            <div className="border border-zinc-200 rounded-lg p-4 bg-white">
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-zinc-500">Username</label>
                  <p className="text-sm text-zinc-900 mt-1">{session.user.username}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-zinc-500">Email</label>
                  <p className="text-sm text-zinc-900 mt-1">{session.user.email}</p>
                </div>
              </div>
            </div>
          </section>

          {/* SSH Keys Section */}
          <section>
            <h2 className="text-sm font-medium text-zinc-900 mb-4 flex items-center gap-2">
              <Icon name="solar:key-linear" size={16} />
              SSH Keys
            </h2>
            <SSHKeyList keys={sshKeys} />
          </section>

          {/* Access Tokens Section */}
          <section>
            <h2 className="text-sm font-medium text-zinc-900 mb-4 flex items-center gap-2">
              <Icon name="solar:shield-keyhole-linear" size={16} />
              Access Tokens
            </h2>
            <AccessTokenList tokens={accessTokens} />
          </section>
        </div>
      </div>
    </>
  )
}

export default SettingsPage
