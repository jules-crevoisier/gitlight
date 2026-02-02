import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'standalone',
  serverExternalPackages: ['simple-git'],
  async rewrites() {
    return [
      // Handle .git suffix in Git URLs
      {
        source: '/api/git/:owner/:repo.git/info/refs',
        destination: '/api/git/:owner/:repo/info/refs',
      },
      {
        source: '/api/git/:owner/:repo.git/git-upload-pack',
        destination: '/api/git/:owner/:repo/git-upload-pack',
      },
      {
        source: '/api/git/:owner/:repo.git/git-receive-pack',
        destination: '/api/git/:owner/:repo/git-receive-pack',
      },
      // Handle Git URLs without .git suffix too
      {
        source: '/:owner/:repo.git/info/refs',
        destination: '/api/git/:owner/:repo/info/refs',
      },
      {
        source: '/:owner/:repo.git/git-upload-pack',
        destination: '/api/git/:owner/:repo/git-upload-pack',
      },
      {
        source: '/:owner/:repo.git/git-receive-pack',
        destination: '/api/git/:owner/:repo/git-receive-pack',
      },
    ]
  },
}

export default nextConfig
