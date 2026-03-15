import type { AuditRule, AuditContext, RouteFile, Vulnerability } from '../types'

const COOKIE_SET_SIGNATURES = [
  'cookies().set(',
  'cookies.set(',
  'response.cookies.set(',
  "res.setHeader('Set-Cookie'",
  'res.setHeader("Set-Cookie"',
  'res.cookie(',
]

const setsCookie = (rawContent: string): boolean =>
  COOKIE_SET_SIGNATURES.some((innerSignature) => rawContent.includes(innerSignature))

const hasAllSecurityFlags = (rawContent: string): boolean => {
  const hasHttpOnly = rawContent.includes('httpOnly') || rawContent.includes('HttpOnly')
  const hasSecure = rawContent.includes('secure:') || rawContent.includes('; Secure')
  const hasSameSite = rawContent.includes('sameSite') || rawContent.includes('SameSite')
  return hasHttpOnly && hasSecure && hasSameSite
}

export const insecureCookie: AuditRule = {
  id: 'RW-COOKIE-001',
  name: 'Insecure Cookie Configuration',
  description: 'Route sets a cookie without required security flags (httpOnly, secure, sameSite).',
  severity: 'medium',
  category: 'authentication',
  enabled: true,
  check(route: RouteFile, _context: AuditContext): Vulnerability[] {
    if (!route.isApiRoute) return []
    if (!setsCookie(route.rawContent)) return []
    if (hasAllSecurityFlags(route.rawContent)) return []

    return [
      {
        id: 'RW-COOKIE-001',
        title: 'Insecure Cookie Configuration',
        description: `The API route ${route.routePath} sets a cookie without all required security flags. Missing httpOnly, secure, or sameSite makes cookies vulnerable to XSS and CSRF attacks.`,
        severity: 'medium',
        category: 'authentication',
        owasp: 'A05:2021 – Security Misconfiguration',
        filePath: route.filePath,
        routePath: route.routePath,
        fix: {
          description:
            'Set httpOnly, secure, and sameSite flags on every cookie to prevent XSS and CSRF attacks.',
          effort: 'low',
          codeExample: `cookies().set('session', token, {\n  httpOnly: true,\n  secure: process.env.NODE_ENV === 'production',\n  sameSite: 'lax',\n  path: '/',\n  maxAge: 60 * 60 * 24 * 7,\n})`,
        },
      },
    ]
  },
}
