'use client'

import { AnimatePresence, LazyMotion, domAnimation, m } from 'motion/react'
import { Check, Copy, Star } from 'lucide-react'
import { useState } from 'react'
import TerminalAnimation from './terminal-animation'

const GITHUB_URL = 'https://github.com/ayaxsoft/route-auditor'
const INSTALL_COMMAND = 'npx @route-auditor/cli audit .'
const BRAND_COLOR = '#6155f5'
const BRAND_HOVER = '#4f44e0'

const Hero = () => {
  const [isCopied, setIsCopied] = useState(false)
  const [copyHover, setCopyHover] = useState(false)
  const [starHover, setStarHover] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(INSTALL_COMMAND)
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2000)
  }

  return (
    <LazyMotion features={domAnimation}>
      <section className="mx-auto grid w-full max-w-6xl grid-cols-[1fr_1.1fr] items-center gap-20 px-8">
        {/* Left — text */}
        <div className="flex flex-col gap-7">
          <p className="font-[family-name:var(--font-geist-mono)] text-xs tracking-widest uppercase text-zinc-400 dark:text-white/30">
            Next.js · Security · CLI
          </p>

          <h1 className="text-[2.75rem] leading-[1.08] font-semibold tracking-[-0.03em] text-zinc-900 dark:text-white">
            Catch security issues in your Next.js routes before they ship
          </h1>

          <p className="text-[0.9375rem] leading-[1.7] text-zinc-500 dark:text-white/40">
            Scans App Router, Pages Router, and API Routes — detecting missing auth, CSRF gaps,
            permissive CORS, hardcoded secrets, and more.
          </p>

          <div className="flex items-center gap-2.5 pt-1">
            {/* Copy command button */}
            <button
              onClick={handleCopy}
              onMouseEnter={() => setCopyHover(true)}
              onMouseLeave={() => setCopyHover(false)}
              style={{
                backgroundColor: isCopied ? '#10b981' : copyHover ? BRAND_HOVER : BRAND_COLOR,
              }}
              className="inline-flex h-9 items-center gap-2.5 rounded-md px-3.5 font-[family-name:var(--font-geist-mono)] text-[0.8125rem] font-medium whitespace-nowrap text-white transition-colors"
            >
              {INSTALL_COMMAND}
              <div className="relative h-3.5 w-3.5 shrink-0">
                <AnimatePresence mode="wait" initial={false}>
                  {isCopied ? (
                    <m.div
                      key="check"
                      initial={{ scale: 0.4, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.4, opacity: 0 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                      className="absolute inset-0"
                    >
                      <Check className="h-3.5 w-3.5" />
                    </m.div>
                  ) : (
                    <m.div
                      key="copy"
                      initial={{ scale: 0.4, opacity: 0 }}
                      animate={{ scale: 1, opacity: 0.7 }}
                      exit={{ scale: 0.4, opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="absolute inset-0"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </m.div>
                  )}
                </AnimatePresence>
              </div>
            </button>

            {/* Star on GitHub */}
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              onMouseEnter={() => setStarHover(true)}
              onMouseLeave={() => setStarHover(false)}
              style={{ backgroundColor: starHover ? BRAND_HOVER : BRAND_COLOR }}
              className="inline-flex h-9 items-center gap-2 rounded-md px-3.5 text-[0.8125rem] font-medium whitespace-nowrap text-white transition-colors"
            >
              <m.div
                animate={{ scale: [1, 1.25, 1], rotate: [0, 8, -8, 0] }}
                transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 3, ease: 'easeInOut' }}
              >
                <Star className="h-3.5 w-3.5" fill="currentColor" />
              </m.div>
              Star on GitHub
            </a>
          </div>
        </div>

        {/* Right — terminal */}
        <TerminalAnimation />
      </section>
    </LazyMotion>
  )
}

export default Hero
