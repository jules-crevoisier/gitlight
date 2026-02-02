import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ToastProvider } from '@/components/ui/Toast'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'GitLight - Self-hosted Git',
  description: 'A lightweight, self-hosted Git hosting platform',
  icons: { icon: '/favicon.svg' },
}

type RootLayoutProps = {
  children: React.ReactNode
}

const RootLayout = ({ children }: RootLayoutProps) => {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className="bg-white text-zinc-900 antialiased dark:bg-zinc-900 dark:text-zinc-100">
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  )
}

export default RootLayout
