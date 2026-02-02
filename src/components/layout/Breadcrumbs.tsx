import Link from 'next/link'
import { Badge } from '@/components/ui/Badge'

type BreadcrumbItem = {
  label: string
  href?: string
}

type BreadcrumbsProps = {
  items: BreadcrumbItem[]
  isPublic?: boolean
  actions?: React.ReactNode
}

export const Breadcrumbs = ({ items, isPublic, actions }: BreadcrumbsProps) => {
  return (
    <div className="h-14 border-b border-zinc-200 flex items-center justify-between px-6 lg:px-8 bg-white shrink-0">
      <div className="flex items-center gap-2 text-sm text-zinc-500">
        {items.map((item, index) => (
          <span key={index} className="flex items-center gap-2">
            {index > 0 ? <span className="text-zinc-300">/</span> : null}
            {item.href ? (
              <Link
                href={item.href}
                className="hover:text-zinc-900 cursor-pointer transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <span className="font-medium text-zinc-900 flex items-center gap-2">
                {item.label}
                {isPublic !== undefined ? (
                  <Badge variant={isPublic ? 'default' : 'info'}>
                    {isPublic ? 'Public' : 'Private'}
                  </Badge>
                ) : null}
              </span>
            )}
          </span>
        ))}
      </div>
      {actions ? (
        <div className="flex items-center gap-3">
          {actions}
        </div>
      ) : null}
    </div>
  )
}
