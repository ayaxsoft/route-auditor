'use client'

import Image from 'next/image'
import Link from 'next/link'
import ThemeToggle from './theme-toggle'

const Header = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-zinc-200 bg-white/80 backdrop-blur-md dark:border-white/5 dark:bg-[#0a0a0a]/80">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-8">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.svg" alt="route-auditor" width={16} height={20} />
          <span className="font-[family-name:var(--font-geist-mono)] text-sm font-medium text-zinc-900 dark:text-white">
            route-auditor
          </span>
        </Link>

        <ThemeToggle />
      </div>
    </header>
  )
}

export default Header
