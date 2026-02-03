'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'

type CloneModalProps = {
  owner: string
  repo: string
  isOpen: boolean
  onClose: () => void
}

export const CloneModal = ({ owner, repo, isOpen, onClose }: CloneModalProps) => {
  const [copied, setCopied] = useState<'https' | 'ssh' | null>(null)

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'
  const httpsUrl = `${baseUrl}/${owner}/${repo}.git`
  const sshUrl = `git@${new URL(baseUrl).hostname}:${owner}/${repo}.git`

  const handleCopy = async (url: string, type: 'https' | 'ssh') => {
    await navigator.clipboard.writeText(url)
    setCopied(type)
    setTimeout(() => setCopied(null), 2000)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-600 shadow-xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Clone repository</h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300"
          >
            <Icon name="solar:close-circle-linear" size={20} />
          </button>
        </div>

        <div className="space-y-4">
          {/* HTTPS */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Icon name="solar:lock-linear" size={14} className="text-zinc-500 dark:text-zinc-400" />
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200">HTTPS</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={httpsUrl}
                className="flex-1 px-3 py-2 text-sm font-mono bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-md text-zinc-900 dark:text-zinc-100"
              />
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleCopy(httpsUrl, 'https')}
              >
                {copied === 'https' ? (
                  <Icon name="solar:check-circle-linear" size={14} className="text-emerald-500" />
                ) : (
                  <Icon name="solar:copy-linear" size={14} />
                  )}
              </Button>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5">
              Use your access token as password when prompted.
            </p>
          </div>

          {/* SSH */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Icon name="solar:key-linear" size={14} className="text-zinc-500 dark:text-zinc-400" />
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200">SSH</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={sshUrl}
                className="flex-1 px-3 py-2 text-sm font-mono bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-md text-zinc-900 dark:text-zinc-100"
              />
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleCopy(sshUrl, 'ssh')}
              >
                {copied === 'ssh' ? (
                  <Icon name="solar:check-circle-linear" size={14} className="text-emerald-500" />
                ) : (
                  <Icon name="solar:copy-linear" size={14} />
                  )}
              </Button>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5">
              Add your SSH key in Settings to use SSH.
            </p>
          </div>

          {/* Clone command */}
          <div className="pt-4 border-t border-zinc-200 dark:border-zinc-700">
            <p className="text-sm text-zinc-600 dark:text-zinc-300 mb-2">Clone with HTTPS:</p>
            <div className="bg-zinc-900 rounded-md p-3 font-mono text-xs text-zinc-100">
              git clone {httpsUrl}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
