'use client'

import { AnimatePresence, LazyMotion, domAnimation, m } from 'motion/react'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

const ThemeToggle = () => {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  if (!mounted) return <div className="h-9 w-9" />

  const isDark = theme === 'dark'

  return (
    <LazyMotion features={domAnimation}>
      <button
        onClick={() => setTheme(isDark ? 'light' : 'dark')}
        aria-label="Toggle theme"
        className="inline-flex h-9 w-9 items-center justify-center overflow-hidden rounded-md border border-zinc-200 bg-zinc-100 text-zinc-500 transition-colors hover:border-zinc-300 hover:bg-zinc-200 hover:text-zinc-900 dark:border-white/10 dark:bg-white/5 dark:text-white/50 dark:hover:border-white/20 dark:hover:bg-white/10 dark:hover:text-white"
      >
        <AnimatePresence mode="wait" initial={false}>
          <m.div
            key={isDark ? 'sun' : 'moon'}
            initial={{ rotate: -45, opacity: 0, scale: 0.7 }}
            animate={{ rotate: 0, opacity: 1, scale: 1 }}
            exit={{ rotate: 45, opacity: 0, scale: 0.7 }}
            transition={{ duration: 0.15, ease: 'easeInOut' }}
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </m.div>
        </AnimatePresence>
      </button>
    </LazyMotion>
  )
}

export default ThemeToggle
