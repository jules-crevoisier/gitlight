import { Metadata } from 'next'
import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'

type LayoutProps = {
  children: React.ReactNode
  params: Promise<{ owner: string; repo: string }>
}

export async function generateMetadata({ params }: LayoutProps): Promise<Metadata> {
  const { owner, repo } = await params
  const repository = await prisma.repository.findFirst({
    where: {
      name: repo,
      owner: { username: owner },
    },
  })
  if (!repository) return { title: 'Repository' }
  return {
    title: `${owner}/${repo} - GitLight`,
    description: repository.description || `Repository ${owner}/${repo}`,
  }
}

export default async function RepoLayout({ children }: LayoutProps) {
  return <>{children}</>
}
