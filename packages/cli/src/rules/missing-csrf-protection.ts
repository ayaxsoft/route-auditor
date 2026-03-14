import type { AuditRule, AuditContext, RouteFile, Vulnerability } from '../types'

const SERVER_ACTION_SIGNATURES = ["'use server'", '"use server"']

const CSRF_PROTECTION_SIGNATURES = [
  'createSafeActionClient', // next-safe-action
  'next-safe-action',
  'createServerAction', // zsa
  'createActionClient',
  'x-csrf-token',
  'csrf-token',
  'csrfToken',
]

const hasServerAction = (rawContent: string): boolean =>
  SERVER_ACTION_SIGNATURES.some((innerSignature) => rawContent.includes(innerSignature))

const hasCsrfProtection = (rawContent: string): boolean =>
  CSRF_PROTECTION_SIGNATURES.some((innerSignature) => rawContent.includes(innerSignature))

export const missingCsrfProtection: AuditRule = {
  id: 'RW-AUTH-002',
  name: 'Missing CSRF Protection in Server Action',
  description: 'Server Action does not appear to have CSRF protection.',
  severity: 'medium',
  category: 'authentication',
  enabled: true,
  check(route: RouteFile, _context: AuditContext): Vulnerability[] {
    if (route.routerType !== 'app') return []
    if (!hasServerAction(route.rawContent)) return []
    if (hasCsrfProtection(route.rawContent)) return []

    return [
      {
        id: 'RW-AUTH-002',
        title: 'Missing CSRF Protection in Server Action',
        description: `The file ${route.routePath} defines Server Actions without explicit CSRF protection. Malicious sites could trigger these actions on behalf of authenticated users.`,
        severity: 'medium',
        category: 'authentication',
        owasp: 'A01:2021 – Broken Access Control',
        filePath: route.filePath,
        routePath: route.routePath,
        fix: {
          description:
            'Use next-safe-action to wrap your Server Actions with built-in CSRF and type-safe validation.',
          effort: 'low',
          codeExample: `import { createSafeActionClient } from 'next-safe-action'\nimport { z } from 'zod'\n\nconst action = createSafeActionClient()\n\nexport const myAction = action\n  .schema(z.object({ id: z.string() }))\n  .action(async ({ parsedInput }) => {\n    // your logic\n  })`,
        },
      },
    ]
  },
}
