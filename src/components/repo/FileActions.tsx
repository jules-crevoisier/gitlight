'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { useToast } from '@/components/ui/Toast'

type FileActionsProps = {
  owner: string
  repo: string
  branch: string
  filePath: string
  content: string
}

export const FileActions = ({ owner, repo, branch, filePath, content }: FileActionsProps) => {
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content)
    setCopied(true)
    toast('Copied to clipboard')
    setTimeout(() => setCopied(false), 2000)
  }

  const handleRaw = () => {
    window.open(`/api/repos/${owner}/${repo}/raw/${branch}/${filePath}`, '_blank')
  }

  const handleDownload = () => {
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filePath.split('/').pop() || 'file'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="secondary" size="sm" onClick={handleCopy}>
        {copied ? (
          <Icon name="solar:check-circle-linear" size={14} className="text-emerald-500" />
        ) : (
          <Icon name="solar:copy-linear" size={14} />
        )}
        {copied ? 'Copied!' : 'Copy'}
      </Button>
      <Button variant="secondary" size="sm" onClick={handleRaw}>
        <Icon name="solar:document-text-linear" size={14} />
        Raw
      </Button>
      <Button variant="secondary" size="sm" onClick={handleDownload}>
        <Icon name="solar:download-linear" size={14} />
        Download
      </Button>
    </div>
  )
}
