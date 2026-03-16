'use client'

import { RotateCcw } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

type LineType =
  | 'command'
  | 'output'
  | 'brand'
  | 'high'
  | 'critical'
  | 'medium'
  | 'meta'
  | 'route'
  | 'fix'
  | 'score'
  | 'bar'
  | 'summary'
interface TerminalLine {
  text: string
  type: LineType
  delay: number
}

const LINE_TYPE_CLASSES: Record<LineType, string> = {
  command: 'text-white font-semibold',
  output: 'text-white/40',
  brand: 'text-violet-400 font-bold',
  high: 'text-amber-400 font-semibold',
  critical: 'text-red-400 font-semibold',
  medium: 'text-yellow-400 font-semibold',
  meta: 'text-white/40',
  route: 'text-white/60',
  fix: 'text-emerald-400/80',
  score: 'text-white font-semibold',
  bar: 'text-emerald-400',
  summary: 'text-white/50',
}

interface Scenario {
  score: number
  bar: string
  totalIssues: number
  totalRoutes: number
  duration: string
  blocks: ScenarioBlock[]
}

interface ScenarioBlock {
  header: { text: string; type: LineType }
  owasp: string
  routes: string[]
  fix: string
}

const SCENARIOS: Scenario[] = [
  {
    score: 85,
    bar: '█████████████████████████████████░░░░░░░',
    totalIssues: 4,
    totalRoutes: 34,
    duration: '0.3s',
    blocks: [
      {
        header: { text: '  [HIGH]  Unprotected API Route  ·  3 routes', type: 'high' },
        owasp: 'OWASP A01:2021 – Broken Access Control',
        routes: [
          '         → /api/users          app/api/users/route.ts',
          '         → /api/posts/[id]     app/api/posts/[id]/route.ts',
          '         → /api/admin          app/api/admin/route.ts',
        ],
        fix: '         Fix: Use getServerSession(authOptions) to verify the session.',
      },
      {
        header: { text: '  [CRITICAL]  Hardcoded Secret  ·  1 route', type: 'critical' },
        owasp: 'OWASP A02:2021 – Cryptographic Failures',
        routes: ['         → /api/payments      app/api/payments/route.ts'],
        fix: '         Fix: Move secrets to environment variables.',
      },
    ],
  },
  {
    score: 72,
    bar: '████████████████████████████░░░░░░░░░░░░░',
    totalIssues: 6,
    totalRoutes: 28,
    duration: '0.4s',
    blocks: [
      {
        header: { text: '  [HIGH]  Permissive CORS Policy  ·  2 routes', type: 'high' },
        owasp: 'OWASP A05:2021 – Security Misconfiguration',
        routes: [
          '         → /api/data           app/api/data/route.ts',
          '         → /api/export         app/api/export/route.ts',
        ],
        fix: '         Fix: Replace wildcard with explicit allowed origins.',
      },
      {
        header: { text: '  [MEDIUM]  Missing Rate Limiting  ·  3 routes', type: 'medium' },
        owasp: 'OWASP A04:2021 – Insecure Design',
        routes: [
          '         → /api/login          app/api/login/route.ts',
          '         → /api/register       app/api/register/route.ts',
          '         → /api/reset-password app/api/reset-password/route.ts',
        ],
        fix: '         Fix: Add rate limiting middleware (e.g. @upstash/ratelimit).',
      },
      {
        header: {
          text: '  [CRITICAL]  Exposed Environment Variable  ·  1 route',
          type: 'critical',
        },
        owasp: 'OWASP A02:2021 – Cryptographic Failures',
        routes: ['         → /api/config        app/api/config/route.ts'],
        fix: '         Fix: Never expose server-side env vars in API responses.',
      },
    ],
  },
  {
    score: 91,
    bar: '████████████████████████████████████░░░░░',
    totalIssues: 2,
    totalRoutes: 41,
    duration: '0.5s',
    blocks: [
      {
        header: { text: '  [HIGH]  Missing CSRF Protection  ·  2 routes', type: 'high' },
        owasp: 'OWASP A01:2021 – Broken Access Control',
        routes: [
          '         → /api/profile        app/api/profile/route.ts',
          '         → /api/settings       app/api/settings/route.ts',
        ],
        fix: '         Fix: Validate Origin header or use a CSRF token.',
      },
    ],
  },
  {
    score: 68,
    bar: '██████████████████████████░░░░░░░░░░░░░░░',
    totalIssues: 7,
    totalRoutes: 22,
    duration: '0.3s',
    blocks: [
      {
        header: { text: '  [CRITICAL]  Path Traversal  ·  1 route', type: 'critical' },
        owasp: 'OWASP A01:2021 – Broken Access Control',
        routes: ['         → /api/files         app/api/files/route.ts'],
        fix: '         Fix: Sanitize file paths and restrict to allowed directories.',
      },
      {
        header: { text: '  [HIGH]  Missing Input Validation  ·  4 routes', type: 'high' },
        owasp: 'OWASP A03:2021 – Injection',
        routes: [
          '         → /api/search         app/api/search/route.ts',
          '         → /api/users/[id]     app/api/users/[id]/route.ts',
          '         → /api/comments       app/api/comments/route.ts',
          '         → /api/orders         app/api/orders/route.ts',
        ],
        fix: '         Fix: Validate request body with zod or similar.',
      },
      {
        header: { text: '  [MEDIUM]  Open Redirect  ·  2 routes', type: 'medium' },
        owasp: 'OWASP A01:2021 – Broken Access Control',
        routes: [
          '         → /api/auth/callback  app/api/auth/callback/route.ts',
          '         → /api/logout         app/api/logout/route.ts',
        ],
        fix: '         Fix: Validate redirect URLs against an allowlist.',
      },
    ],
  },
]

const HEADER_LINES: TerminalLine[] = [
  { text: '$ npx @route-auditor/cli audit .', type: 'command', delay: 0 },
  { text: '', type: 'output', delay: 600 },
  { text: '⚡ route-auditor', type: 'brand', delay: 900 },
  { text: 'Auditing Next.js routes for security issues...', type: 'output', delay: 1200 },
  { text: '', type: 'output', delay: 1600 },
]

const buildLines = (scenario: Scenario): TerminalLine[] => {
  const lines: TerminalLine[] = [...HEADER_LINES]
  let delay = 1900

  for (const block of scenario.blocks) {
    lines.push({ text: block.header.text, type: block.header.type, delay })
    delay += 100
    lines.push({ text: `         ${block.owasp}`, type: 'meta', delay })
    delay += 100
    lines.push({ text: '', type: 'output', delay })
    delay += 100

    for (const route of block.routes) {
      lines.push({ text: route, type: 'route', delay })
      delay += 150
    }

    lines.push({ text: '', type: 'output', delay })
    delay += 100
    lines.push({ text: block.fix, type: 'fix', delay })
    delay += 200
    lines.push({ text: '', type: 'output', delay })
    delay += 100
  }

  const scoreLabel = scenario.score >= 90 ? 'Great' : scenario.score >= 75 ? 'Good' : 'Fair'
  lines.push({ text: `  ${scenario.score} / 100  ${scoreLabel}`, type: 'score', delay })
  delay += 200
  lines.push({ text: `  ${scenario.bar}`, type: 'bar', delay })
  delay += 100
  lines.push({ text: '', type: 'output', delay })
  delay += 100
  lines.push({
    text: `  ${scenario.totalIssues} vulnerabilities across ${scenario.totalRoutes} routes in ${scenario.duration}`,
    type: 'summary',
    delay,
  })

  return lines
}

const TerminalAnimation = () => {
  const [lines, setLines] = useState<TerminalLine[]>(() => buildLines(SCENARIOS[0]))
  const [visibleCount, setVisibleCount] = useState(0)
  const [isComplete, setIsComplete] = useState(false)
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([])
  const scrollRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLSpanElement>(null)

  const clearAllTimeouts = () => {
    timeoutsRef.current.forEach(clearTimeout)
    timeoutsRef.current = []
  }

  const startAnimation = () => {
    clearAllTimeouts()
    if (scrollRef.current) scrollRef.current.scrollTop = 0

    const scenario = SCENARIOS[Math.floor(Math.random() * SCENARIOS.length)]
    const newLines = buildLines(scenario)
    setLines(newLines)
    setVisibleCount(0)
    setIsComplete(false)

    const lineTimeouts = newLines.map((line, index) =>
      setTimeout(() => setVisibleCount(index + 1), line.delay),
    )

    const lastDelay = newLines[newLines.length - 1].delay + 400
    const completionTimeout = setTimeout(() => setIsComplete(true), lastDelay)

    timeoutsRef.current = [...lineTimeouts, completionTimeout]
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [visibleCount])

  useEffect(() => {
    startAnimation()
    return clearAllTimeouts
  }, [])

  return (
    <div className="overflow-hidden rounded-xl border border-black/10 bg-[#f5f5f5] dark:border-white/5 dark:bg-[#0a0a0a]">
      <div className="flex items-center gap-1.5 border-b border-black/5 px-4 py-3 dark:border-white/5">
        <span className="h-3 w-3 rounded-full bg-red-500/60" />
        <span className="h-3 w-3 rounded-full bg-amber-500/60" />
        <span className="h-3 w-3 rounded-full bg-emerald-500/60" />
        <span className="ml-2 font-mono text-xs text-black/20 dark:text-white/50">
          ~/nextjs-project
        </span>
        {isComplete && (
          <button
            onClick={startAnimation}
            className="ml-auto flex items-center gap-1.5 rounded px-2 py-0.5 text-xs text-black/20 transition-colors hover:text-black/50 dark:text-white/20 dark:hover:text-white/50"
          >
            <RotateCcw className="h-3 w-3" />
            Replay
          </button>
        )}
      </div>
      <div ref={scrollRef} className="h-[320px] overflow-y-auto p-5 [&::-webkit-scrollbar]:hidden">
        <div className="font-mono text-[0.8125rem] leading-[1.65]">
          {lines.slice(0, visibleCount).map((line, index) => (
            <div key={`${index}-${line.text}`} className={LINE_TYPE_CLASSES[line.type]}>
              {line.text || '\u00A0'}
            </div>
          ))}
          {!isComplete && visibleCount < lines.length && (
            <span className="inline-block h-4 w-2 animate-pulse bg-black/60 dark:bg-white/60" />
          )}
          <span ref={bottomRef} />
        </div>
      </div>
    </div>
  )
}

export default TerminalAnimation
