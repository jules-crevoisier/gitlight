import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Script from 'next/script'
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

const themeScript = `(function(){
  try {
    var stored = localStorage.getItem('theme');
    var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    var isDark = stored === 'dark' || (stored !== 'light' && prefersDark);
    var el = document.documentElement;
    el.classList.toggle('dark', isDark);
    el.setAttribute('data-theme', isDark ? 'dark' : 'light');
    el.style.colorScheme = isDark ? 'dark' : 'light';
  } catch (e) {}
})();`

const RootLayout = ({ children }: RootLayoutProps) => {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        <Script
          id="theme-script"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: themeScript }}
        />
      </head>
      <body className="bg-background text-foreground antialiased" suppressHydrationWarning>
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  )
}

export default RootLayout
