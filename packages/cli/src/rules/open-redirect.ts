import type { AuditRule, AuditContext, RouteFile, Vulnerability } from '../types'

const USER_INPUT_REDIRECT_PATTERNS = [
  'redirect(searchParams',
  'redirect(params.',
  'redirect(callbackUrl',
  'redirect(returnUrl',
  'redirect(redirectUrl',
  'redirect(redirectTo',
  'redirect(next)',
  'redirect(url)',
  'redirect(href)',
  'redirect(destination',
  'redirect(target',
  'redirect(req.query',
  'redirect(query.',
  'redirect(body.',
  'redirect(`',
]

const SAFE_REDIRECT_PATTERNS = [
  "startsWith('/')",
  "startsWith('/')",
  'new URL(',
  'isValidUrl',
  'isAllowedUrl',
  'allowedOrigins',
  'ALLOWED_REDIRECTS',
  'redirectAllowList',
]

const hasUnsafeRedirect = (rawContent: string): boolean =>
  USER_INPUT_REDIRECT_PATTERNS.some((innerPattern) => rawContent.includes(innerPattern))

const hasSafeRedirectGuard = (rawContent: string): boolean =>
  SAFE_REDIRECT_PATTERNS.some((innerPattern) => rawContent.includes(innerPattern))

export const openRedirect: AuditRule = {
  id: 'RW-REDIRECT-001',
  name: 'Potential Open Redirect',
  description:
    'Route passes user-controlled input directly to redirect() without validating the destination.',
  severity: 'medium',
  category: 'configuration',
  enabled: true,
  check(route: RouteFile, _context: AuditContext): Vulnerability[] {
    if (!hasUnsafeRedirect(route.rawContent)) return []
    if (hasSafeRedirectGuard(route.rawContent)) return []

    return [
      {
        id: 'RW-REDIRECT-001',
        title: 'Potential Open Redirect',
        description: `The route ${route.routePath} passes user-controlled input to redirect() without validating the destination. An attacker could redirect users to a malicious site.`,
        severity: 'medium',
        category: 'configuration',
        owasp: 'A01:2021 – Broken Access Control',
        filePath: route.filePath,
        routePath: route.routePath,
        fix: {
          description:
            "Validate the redirect destination — ensure it starts with '/' or matches an allowlist of trusted origins.",
          effort: 'low',
          codeExample: `import { redirect } from 'next/navigation'\n\nconst callbackUrl = searchParams.get('callbackUrl') ?? '/'\n\n// Only allow relative paths to prevent open redirect\nconst safeUrl = callbackUrl.startsWith('/') ? callbackUrl : '/'\n\nredirect(safeUrl)`,
        },
      },
    ]
  },
}
