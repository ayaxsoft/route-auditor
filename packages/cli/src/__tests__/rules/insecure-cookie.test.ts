import { describe, it, expect } from 'vitest'
import { insecureCookie } from '../../rules/insecure-cookie'
import type { RouteFile, AuditContext } from '../../types'

const buildRouteFile = (overrides: Partial<RouteFile> = {}): RouteFile => ({
  projectRoot: '/project',
  filePath: '/project/app/api/auth/login/route.ts',
  routePath: '/api/auth/login',
  routerType: 'app',
  isApiRoute: true,
  isDynamic: false,
  dynamicSegments: [],
  hasCatchAll: false,
  hasOptionalCatchAll: false,
  methods: ['POST'],
  exports: ['POST'],
  rawContent: "cookies().set('session', token)",
  ...overrides,
})

const buildContext = (overrides: Partial<AuditContext> = {}): AuditContext => ({
  projectRoot: '/project',
  routerType: 'app',
  detectedStack: {},
  config: {},
  allRoutes: [],
  ...overrides,
})

describe('insecureCookie', () => {
  describe('when route is not an API route', () => {
    it('returns no vulnerabilities', () => {
      const route = buildRouteFile({ isApiRoute: false })
      expect(insecureCookie.check(route, buildContext())).toHaveLength(0)
    })
  })

  describe('when route does not set cookies', () => {
    it('returns no vulnerabilities', () => {
      const route = buildRouteFile({
        rawContent: 'export async function POST() { return Response.json({}) }',
      })
      expect(insecureCookie.check(route, buildContext())).toHaveLength(0)
    })
  })

  describe('when route sets a cookie without security flags', () => {
    it.each([
      ['cookies().set(', "cookies().set('session', token)"],
      ['cookies.set(', "cookies.set('token', value)"],
      ['response.cookies.set(', "response.cookies.set('auth', value)"],
      ["res.setHeader('Set-Cookie'", "res.setHeader('Set-Cookie', 'session=abc')"],
      ['res.setHeader("Set-Cookie"', 'res.setHeader("Set-Cookie", "session=abc")'],
      ['res.cookie(', "res.cookie('session', token)"],
    ])('returns a vulnerability for %s', (_, rawContent) => {
      const route = buildRouteFile({ rawContent })
      const result = insecureCookie.check(route, buildContext())
      expect(result).toHaveLength(1)
      expect(result[0]?.id).toBe('RW-COOKIE-001')
      expect(result[0]?.severity).toBe('medium')
    })
  })

  describe('when route sets a cookie with all security flags', () => {
    it('returns no vulnerabilities when all flags are present', () => {
      const route = buildRouteFile({
        rawContent: `cookies().set('session', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
        })`,
      })
      expect(insecureCookie.check(route, buildContext())).toHaveLength(0)
    })

    it('returns no vulnerabilities with Set-Cookie header format', () => {
      const route = buildRouteFile({
        rawContent: "res.setHeader('Set-Cookie', 'session=abc; HttpOnly; Secure; SameSite=Lax')",
      })
      expect(insecureCookie.check(route, buildContext())).toHaveLength(0)
    })

    it('returns a vulnerability when only httpOnly is present', () => {
      const route = buildRouteFile({
        rawContent: "cookies().set('session', token, { httpOnly: true })",
      })
      expect(insecureCookie.check(route, buildContext())).toHaveLength(1)
    })
  })

  describe('fix suggestion', () => {
    it('includes a code example with all three security flags', () => {
      const result = insecureCookie.check(buildRouteFile(), buildContext())
      expect(result[0]?.fix.codeExample).toContain('httpOnly')
      expect(result[0]?.fix.codeExample).toContain('secure')
      expect(result[0]?.fix.codeExample).toContain('sameSite')
    })

    it('always returns low effort', () => {
      const result = insecureCookie.check(buildRouteFile(), buildContext())
      expect(result[0]?.fix.effort).toBe('low')
    })
  })
})
