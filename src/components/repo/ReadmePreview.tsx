import { Icon } from '@/components/ui/Icon'
import { cn } from '@/lib/utils'

type ReadmePreviewProps = {
  content: string
  className?: string
}

export const ReadmePreview = ({ content, className }: ReadmePreviewProps) => {
  // Simple markdown parsing for basic elements
  const parseMarkdown = (text: string): string => {
    let html = text
      // Code blocks
      .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre class="bg-zinc-900 rounded-md p-4 text-zinc-100 font-mono text-xs overflow-x-auto my-4"><code>$2</code></pre>')
      // Inline code
      .replace(/`([^`]+)`/g, '<code class="bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 px-1.5 py-0.5 rounded text-xs font-mono">$1</code>')
      // Headers
      .replace(/^### (.+)$/gm, '<h3 class="text-base font-medium tracking-tight text-zinc-900 dark:text-zinc-100 mt-6 mb-2">$1</h3>')
      .replace(/^## (.+)$/gm, '<h2 class="text-xl font-medium tracking-tight text-zinc-900 dark:text-zinc-100 mt-0 mb-4">$1</h2>')
      .replace(/^# (.+)$/gm, '<h1 class="text-2xl font-medium tracking-tight text-zinc-900 dark:text-zinc-100 mt-0 mb-4">$1</h1>')
      // Bold
      .replace(/\*\*(.+?)\*\*/g, '<strong class="font-medium">$1</strong>')
      // Italic
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      // Links
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-600 dark:text-blue-400 hover:underline">$1</a>')
      // Bullet lists
      .replace(/^- (.+)$/gm, '<li class="text-sm text-zinc-600 dark:text-zinc-300 pl-2">$1</li>')
      // Paragraphs
      .replace(/\n\n/g, '</p><p class="text-zinc-500 dark:text-zinc-300 leading-relaxed mb-4">')

    // Wrap lists
    html = html.replace(/(<li.*<\/li>\n?)+/g, (match) => 
      `<ul class="space-y-1 pl-4 border-l border-zinc-200 dark:border-zinc-700 ml-0.5 my-4">${match}</ul>`
    )

    return `<p class="text-zinc-500 dark:text-zinc-300 leading-relaxed mb-4">${html}</p>`
  }

  return (
    <div
      className={cn(
        'border border-zinc-200 dark:border-zinc-700 rounded-lg overflow-hidden bg-white dark:bg-zinc-900 shadow-sm',
        className
      )}
    >
      <div className="bg-zinc-50 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700 px-4 py-2 flex items-center gap-2">
        <Icon name="solar:list-linear" size={16} className="text-zinc-500 dark:text-zinc-400" />
        <span className="text-xs font-medium text-zinc-700 dark:text-zinc-200 uppercase tracking-wide">README.md</span>
      </div>
      <div 
        className="p-8 prose prose-zinc prose-sm max-w-none text-zinc-900 dark:text-zinc-100"
        dangerouslySetInnerHTML={{ __html: parseMarkdown(content) }}
      />
    </div>
  )
}
