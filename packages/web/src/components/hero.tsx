'use client'

import { AnimatePresence, LazyMotion, domAnimation, m } from 'motion/react'
import { Check, Copy } from 'lucide-react'
import { useCallback, useRef, useState } from 'react'
import TerminalAnimation from './terminal-animation'
import { FlipWords } from './ui/flip-words'

const GITHUB_URL = 'https://github.com/ayaxsoft/route-auditor'
const INSTALL_COMMAND = 'npx @route-auditor/cli audit .'
const BRAND_COLOR = '#6155f5'
const BRAND_HOVER = '#4f44e0'
interface SonarOrigin { x: number; y: number }

const SonarOverlay = ({ origin }: { origin: SonarOrigin }) => {
  const rings = [0]
  const maxRadius = Math.hypot(
    Math.max(origin.x, window.innerWidth - origin.x),
    Math.max(origin.y, window.innerHeight - origin.y),
  )

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {rings.map((i) => (
        <m.div
          key={i}
          initial={{ width: 0, height: 0, opacity: 0.7, x: origin.x, y: origin.y }}
          animate={{
            width: maxRadius * 2.2,
            height: maxRadius * 2.2,
            opacity: 0,
            x: origin.x - maxRadius * 1.1,
            y: origin.y - maxRadius * 1.1,
          }}
          transition={{ duration: 1.6, delay: i * 0.18, ease: [0.2, 0.8, 0.4, 1] }}
          style={{ borderRadius: '50%', position: 'absolute' }}
          className="border border-violet-500/60"
        />
      ))}
    </div>
  )
}

const Hero = () => {
  const [isCopied, setIsCopied] = useState(false)
  const [copyHover, setCopyHover] = useState(false)
  const [sonarOrigin, setSonarOrigin] = useState<SonarOrigin | null>(null)
  const copyBtnRef = useRef<HTMLButtonElement>(null)

  const handleDone = useCallback(() => setSonarOrigin(null), [])

  const handleCopy = async () => {
    await navigator.clipboard.writeText(INSTALL_COMMAND)
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2000)

    const btn = copyBtnRef.current
    if (btn) {
      const rect = btn.getBoundingClientRect()
      setSonarOrigin({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 })
      setTimeout(handleDone, 2000)
    }
  }

  return (
    <LazyMotion features={domAnimation}>
      <AnimatePresence>{sonarOrigin && <SonarOverlay origin={sonarOrigin} />}</AnimatePresence>

      <section className="mx-auto grid w-full max-w-6xl grid-cols-[1fr_1.1fr] items-center gap-20 px-8">
        {/* Left — text */}
        <div className="flex flex-col gap-7">
          <p className="font-[family-name:var(--font-geist-mono)] text-xs tracking-widest uppercase text-zinc-400 dark:text-white/30">
            Next.js · Security · CLI
          </p>

          <h1 className="text-[2.75rem] leading-[1.08] font-semibold tracking-[-0.03em] text-zinc-900 dark:text-white">
            Catch
            <FlipWords
              words={['CSRF gaps,', 'auth gaps,', 'secret leaks,', 'CORS gaps,', 'open redirects,', 'input errors,']}
              duration={2800}
              className="text-violet-500 dark:text-violet-400"
            />
            in your Next.js routes before they ship
          </h1>

          <p className="text-[0.9375rem] leading-[1.7] text-zinc-500 dark:text-white/40">
            Scans App Router, Pages Router, and API Routes — detecting missing auth, CSRF gaps,
            permissive CORS, hardcoded secrets, and more.
          </p>

          <div className="flex items-center gap-2.5 pt-1">
            {/* Copy command button */}
            <button
              ref={copyBtnRef}
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
              style={{ backgroundColor: BRAND_COLOR }}
              className="relative inline-flex h-9 items-center gap-2 overflow-hidden rounded-md px-3.5 text-[0.8125rem] font-medium whitespace-nowrap text-white transition-colors hover:bg-[#4f44e0]"
            >
              <m.span
                className="pointer-events-none absolute inset-0 -translate-x-full skew-x-[-20deg] bg-white/20"
                animate={{ translateX: ['-100%', '200%'] }}
                transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 3, ease: 'easeInOut' }}
              />
              <svg
                viewBox="0 0 98 96"
                className="relative h-3.5 w-3.5 fill-current"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path fillRule="evenodd" clipRule="evenodd" d="M48.854 0C21.839 0 0 22 0 49.217c0 21.756 13.993 40.172 33.405 46.69 2.427.49 3.316-1.059 3.316-2.362 0-1.141-.08-5.052-.08-9.127-13.59 2.934-16.42-5.867-16.42-5.867-2.184-5.704-5.42-7.17-5.42-7.17-4.448-3.015.324-3.015.324-3.015 4.934.326 7.523 5.052 7.523 5.052 4.367 7.496 11.404 5.378 14.235 4.074.404-3.178 1.699-5.378 3.074-6.6-10.839-1.141-22.243-5.378-22.243-24.283 0-5.378 1.94-9.778 5.014-13.2-.485-1.222-2.184-6.275.486-13.038 0 0 4.125-1.304 13.426 5.052a46.97 46.97 0 0 1 12.214-1.63c4.125 0 8.33.571 12.213 1.63 9.302-6.356 13.427-5.052 13.427-5.052 2.67 6.763.97 11.816.485 13.038 3.155 3.422 5.015 7.822 5.015 13.2 0 18.905-11.404 23.06-22.324 24.283 1.78 1.548 3.316 4.481 3.316 9.126 0 6.6-.08 11.897-.08 13.526 0 1.304.89 2.853 3.316 2.364 19.412-6.52 33.405-24.935 33.405-46.691C97.707 22 75.788 0 48.854 0z" />
              </svg>
              <span className="relative">Star on GitHub</span>
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
