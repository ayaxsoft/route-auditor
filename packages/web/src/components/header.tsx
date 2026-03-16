'use client'

import { Star } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

const GITHUB_URL = 'https://github.com/ayaxsoft/route-auditor'
const BRAND_COLOR = '#6155f5'

const Header = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#242424]/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-8">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.svg" alt="route-auditor" width={16} height={20} />
          <span className="font-[family-name:var(--font-geist-mono)] text-sm font-medium text-white">
            route-auditor
          </span>
        </Link>

        <a
          href={GITHUB_URL}
          target="_blank"
          rel="noopener noreferrer"
          style={{ backgroundColor: BRAND_COLOR }}
          className="inline-flex h-9 items-center gap-1.5 rounded-md px-3 text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          <Star className="h-3.5 w-3.5" fill="currentColor" />
          Star on GitHub
        </a>
      </div>
    </header>
  )
}

export default Header
