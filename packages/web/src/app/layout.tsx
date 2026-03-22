import type { Metadata, Viewport } from 'next'
import { GeistMono } from 'geist/font/mono'
import { GeistSans } from 'geist/font/sans'
import { cn } from '@/lib/utils'
import ThemeProvider from '@/components/theme-provider'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

export const metadata: Metadata = {
  title: 'route-auditor — Security auditor for Next.js routes',
  description:
    'Catch security issues in your Next.js routes before they reach production. Scans App Router, Pages Router, and API Routes.',
  keywords: ['nextjs', 'security', 'audit', 'cli', 'routes'],
  icons: {
    icon: '/logo.svg',
  },
  openGraph: {
    title: 'route-auditor',
    description: 'Catch security issues in your Next.js routes before they reach production.',
    type: 'website',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

interface RootLayoutProps {
  children: React.ReactNode
}

const RootLayout = ({ children }: RootLayoutProps) => {
  return (
    <html lang="en" suppressHydrationWarning className={cn(GeistSans.variable, GeistMono.variable)}>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}

export default RootLayout
