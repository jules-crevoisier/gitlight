import { Tabs } from '@/components/ui/Tabs'
import { Icon } from '@/components/ui/Icon'

type RepoTabsProps = {
  owner: string
  repo: string
  activeTab: string
  prCount?: number
  currentBranch?: string
  defaultBranch?: string
}

export const RepoTabs = ({ 
  owner, 
  repo, 
  activeTab, 
  prCount = 0,
  currentBranch,
  defaultBranch,
}: RepoTabsProps) => {
  const basePath = `/${owner}/${repo}`
  const branchQuery = currentBranch && currentBranch !== defaultBranch 
    ? `?ref=${encodeURIComponent(currentBranch)}` 
    : ''

  const tabs = [
    {
      id: 'code',
      label: 'Code',
      href: `${basePath}${branchQuery}`,
      icon: <Icon name="solar:code-linear" size={16} />,
    },
    {
      id: 'commits',
      label: 'Commits',
      href: `${basePath}/commits${branchQuery}`,
      icon: <Icon name="solar:git-commit-linear" size={16} />,
    },
    {
      id: 'pulls',
      label: 'Pull Requests',
      href: `${basePath}/pulls`,
      icon: <Icon name="solar:git-pull-request-linear" size={16} />,
      count: prCount > 0 ? prCount : undefined,
    },
    {
      id: 'issues',
      label: 'Issues',
      href: `${basePath}/issues`,
      icon: <Icon name="solar:shield-warning-linear" size={16} />,
    },
  ]

  return <Tabs tabs={tabs} activeTab={activeTab} className="mb-6" />
}
