'use client'

import { Icon as IconifyIcon } from '@iconify/react'

type IconProps = {
  name: string
  size?: number
  className?: string
}

export const Icon = ({ name, size = 18, className }: IconProps) => {
  return (
    <IconifyIcon
      icon={name}
      width={size}
      height={size}
      className={className}
    />
  )
}
