import { cn, getInitials } from '@/lib/utils'

type AvatarSize = 'sm' | 'md' | 'lg'

type AvatarProps = {
  name: string
  src?: string
  size?: AvatarSize
  className?: string
}

const sizeStyles: Record<AvatarSize, string> = {
  sm: 'w-5 h-5 text-[8px]',
  md: 'w-8 h-8 text-xs',
  lg: 'w-10 h-10 text-sm',
}

export const Avatar = ({ name, src, size = 'md', className }: AvatarProps) => {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={cn(
          'rounded-full object-cover',
          sizeStyles[size],
          className
        )}
      />
    )
  }

  return (
    <div
      className={cn(
        'rounded-full bg-zinc-200 flex items-center justify-center font-medium text-zinc-600',
        sizeStyles[size],
        className
      )}
      title={name}
    >
      {getInitials(name)}
    </div>
  )
}
