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
          <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-foreground-muted">
            {icon}
          </div>
        ) : null}
        <input
          ref={ref}
          className={cn(
            'w-full rounded-md border border-border bg-background text-foreground text-sm',
            'placeholder:text-foreground-muted',
            'focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground-muted',
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
