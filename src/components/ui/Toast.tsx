'use client'

import { createContext, useCallback, useContext, useState } from 'react'
import { Icon } from './Icon'
import { cn } from '@/lib/utils'

type ToastType = 'success' | 'error' | 'info'

type Toast = {
  id: string
  message: string
  type: ToastType
}

type ToastContextValue = {
  toast: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export const useToast = () => {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    return {
      toast: () => {},
    }
  }
  return ctx
}

const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = useCallback((message: string, type: ToastType = 'success') => {
    const id = Math.random().toString(36).slice(2)
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3000)
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
        <div className="pointer-events-auto flex flex-col gap-2">
          {toasts.map((t) => (
            <div
              key={t.id}
              role="alert"
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border text-sm font-medium min-w-[280px]',
                t.type === 'success' && 'bg-emerald-50 border-emerald-200 text-emerald-800',
                t.type === 'error' && 'bg-red-50 border-red-200 text-red-800',
                t.type === 'info' && 'bg-blue-50 border-blue-200 text-blue-800'
              )}
            >
              {t.type === 'success' && (
                <Icon name="solar:check-circle-linear" size={20} className="text-emerald-600 shrink-0" />
              )}
              {t.type === 'error' && (
                <Icon name="solar:danger-triangle-linear" size={20} className="text-red-600 shrink-0" />
              )}
              {t.type === 'info' && (
                <Icon name="solar:info-circle-linear" size={20} className="text-blue-600 shrink-0" />
              )}
              <span className="flex-1">{t.message}</span>
              <button
                type="button"
                onClick={() => removeToast(t.id)}
                className="text-zinc-400 hover:text-zinc-600 shrink-0"
                aria-label="Close"
              >
                <Icon name="solar:close-circle-linear" size={18} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </ToastContext.Provider>
  )
}

export { ToastProvider }
