import { cn } from '@/lib/utils'

type SkeletonProps = {
  className?: string
}

export const Skeleton = ({ className }: SkeletonProps) => {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-700', className)}
      aria-hidden
    />
  )
}

export const SkeletonList = ({ rows = 5 }: { rows?: number }) => {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  )
}
