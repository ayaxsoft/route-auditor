'use client'

import { RotateCcw } from 'lucide-react'
import { useState } from 'react'
import { Terminal } from './ui/terminal'

interface Scenario {
  outputs: string[]
}

const SCENARIOS: Scenario[] = [
  {
    outputs: [
      '⚡ route-auditor',
      'Auditing Next.js routes for security issues...',
      '',
      '  [HIGH]  Unprotected API Route  ·  3 routes',
      '         OWASP A01:2021 – Broken Access Control',
      '',
      '         → /api/users          app/api/users/route.ts',
      '         → /api/posts/[id]     app/api/posts/[id]/route.ts',
      '         → /api/admin          app/api/admin/route.ts',
      '',
      '         Fix: Use getServerSession(authOptions) to verify the session.',
      '',
      '  [CRITICAL]  Hardcoded Secret  ·  1 route',
      '         OWASP A02:2021 – Cryptographic Failures',
      '',
      '         → /api/payments      app/api/payments/route.ts',
      '',
      '         Fix: Move secrets to environment variables.',
      '',
      '  85 / 100  Good',
      '  █████████████████████████████████░░░░░░░',
      '',
      '  4 vulnerabilities across 34 routes in 0.3s',
    ],
  },
  {
    outputs: [
      '⚡ route-auditor',
      'Auditing Next.js routes for security issues...',
      '',
      '  [HIGH]  Permissive CORS Policy  ·  2 routes',
      '         OWASP A05:2021 – Security Misconfiguration',
      '',
      '         → /api/data           app/api/data/route.ts',
      '         → /api/export         app/api/export/route.ts',
      '',
      '         Fix: Replace wildcard with explicit allowed origins.',
      '',
      '  [MEDIUM]  Missing Rate Limiting  ·  3 routes',
      '         OWASP A04:2021 – Insecure Design',
      '',
      '         → /api/login          app/api/login/route.ts',
      '         → /api/register       app/api/register/route.ts',
      '         → /api/reset-password app/api/reset-password/route.ts',
      '',
      '         Fix: Add rate limiting middleware (e.g. @upstash/ratelimit).',
      '',
      '  72 / 100  Good',
      '  ████████████████████████████░░░░░░░░░░░░░',
      '',
      '  5 vulnerabilities across 28 routes in 0.4s',
    ],
  },
  {
    outputs: [
      '⚡ route-auditor',
      'Auditing Next.js routes for security issues...',
      '',
      '  [HIGH]  Missing CSRF Protection  ·  2 routes',
      '         OWASP A01:2021 – Broken Access Control',
      '',
      '         → /api/profile        app/api/profile/route.ts',
      '         → /api/settings       app/api/settings/route.ts',
      '',
      '         Fix: Validate Origin header or use a CSRF token.',
      '',
      '  91 / 100  Great',
      '  ████████████████████████████████████░░░░░',
      '',
      '  2 vulnerabilities across 41 routes in 0.5s',
    ],
  },
]

const COMMAND = 'npx @route-auditor/cli audit .'

const TerminalAnimation = () => {
  const [key, setKey] = useState(0)
  const [scenarioIdx] = useState(() => Math.floor(Math.random() * SCENARIOS.length))

  const scenario = SCENARIOS[scenarioIdx]

  return (
    <div className="relative">
      <Terminal
        key={key}
        commands={[COMMAND]}
        outputs={{ 0: scenario.outputs }}
        username="~/nextjs-project"
        typingSpeed={45}
        delayBetweenCommands={1000}
        enableSound
      />
      <button
        onClick={() => setKey((k) => k + 1)}
        className="absolute right-2 top-2 flex items-center gap-1.5 rounded px-2 py-0.5 text-xs text-neutral-500 transition-colors hover:text-neutral-300 sm:right-4 sm:top-3"
      >
        <RotateCcw className="h-3 w-3" />
        Replay
      </button>
    </div>
  )
}

export default TerminalAnimation
