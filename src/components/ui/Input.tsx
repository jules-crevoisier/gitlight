'use client'

import { cn } from '@/lib/utils'
import { forwardRef, type InputHTMLAttributes } from 'react'

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  icon?: React.ReactNode
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, icon, error, ...props }, ref) => {
    return (
      <div className="relative">
        {icon ? (
          <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400">
            {icon}
          </div>
        ) : null}
        <input
          ref={ref}
          className={cn(
            'w-full rounded-md border border-zinc-200 bg-white text-sm',
            'placeholder:text-zinc-400',
            'focus:outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-300',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'transition-colors',
            icon ? 'pl-8 pr-3 py-1.5' : 'px-3 py-1.5',
            error && 'border-red-500 focus:border-red-500 focus:ring-red-500/10',
            className
          )}
          {...props}
        />
        {error ? (
          <p className="mt-1 text-xs text-red-500">{error}</p>
        ) : null}
      </div>
    )
  }
)

Input.displayName = 'Input'
