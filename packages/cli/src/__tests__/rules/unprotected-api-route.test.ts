import { describe, it, expect } from 'vitest'
import { unprotectedApiRoute } from '../../rules/unprotected-api-route'
import type { RouteFile, AuditContext } from '../../types'

const buildRouteFile = (overrides: Partial<RouteFile> = {}): RouteFile => ({
  projectRoot: '/project',
  filePath: '/project/app/api/users/route.ts',
  routePath: '/api/users',
  routerType: 'app',
  isApiRoute: true,
  isDynamic: false,
  dynamicSegments: [],
  hasCatchAll: false,
  hasOptionalCatchAll: false,
  methods: ['GET'],
  exports: ['GET'],
  rawContent: 'export async function GET() { return Response.json({}) }',
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

describe('unprotectedApiRoute', () => {
  describe('when route is not an API route', () => {
    it('returns no vulnerabilities', () => {
      const route = buildRouteFile({ isApiRoute: false })
      const result = unprotectedApiRoute.check(route, buildContext())
      expect(result).toHaveLength(0)
    })
  })

  describe('when route has no auth', () => {
    it('returns a vulnerability for an unprotected API route', () => {
      const route = buildRouteFile()
      const result = unprotectedApiRoute.check(route, buildContext())
      expect(result).toHaveLength(1)
      expect(result[0]?.id).toBe('RW-AUTH-001')
      expect(result[0]?.severity).toBe('high')
      expect(result[0]?.routePath).toBe('/api/users')
    })
  })

  describe('when route has generic auth signatures', () => {
    it.each([
      ['Authorization header', 'const header = req.headers.get("Authorization")'],
      ['Bearer token', 'const token = Bearer something'],
      ['getServerSession', 'const session = await getServerSession(authOptions)'],
      ['validateToken', 'const user = await validateToken(req)'],
      ['requireAuth', 'await requireAuth(req)'],
      ['withAuth', 'export default withAuth(handler)'],
      ['isAuthenticated', 'if (!isAuthenticated(req)) return'],
      ['checkAuth', 'checkAuth(req)'],
    ])('returns no vulnerabilities when content includes %s', (_, rawContent) => {
      const route = buildRouteFile({ rawContent })
      const result = unprotectedApiRoute.check(route, buildContext())
      expect(result).toHaveLength(0)
    })
  })

  describe('when stack auth is detected', () => {
    it('returns no vulnerabilities when next-auth signature is present', () => {
      const route = buildRouteFile({ rawContent: 'const session = await getServerSession(authOptions)' })
      const context = buildContext({ detectedStack: { auth: 'next-auth' } })
      const result = unprotectedApiRoute.check(route, context)
      expect(result).toHaveLength(0)
    })

    it('returns no vulnerabilities when clerk signature is present', () => {
      const route = buildRouteFile({ rawContent: 'const { userId } = auth()' })
      const context = buildContext({ detectedStack: { auth: 'clerk' } })
      const result = unprotectedApiRoute.check(route, context)
      expect(result).toHaveLength(0)
    })

    it('returns no vulnerabilities when supabase auth signature is present', () => {
      const route = buildRouteFile({ rawContent: 'const { data } = await supabase.auth.getUser()' })
      const context = buildContext({ detectedStack: { auth: 'supabase' } })
      const result = unprotectedApiRoute.check(route, context)
      expect(result).toHaveLength(0)
    })

    it('returns vulnerability when stack is detected but signature is absent', () => {
      const route = buildRouteFile({ rawContent: 'export async function GET() { return Response.json({}) }' })
      const context = buildContext({ detectedStack: { auth: 'next-auth' } })
      const result = unprotectedApiRoute.check(route, context)
      expect(result).toHaveLength(1)
    })
  })

  describe('fix description', () => {
    it('returns generic fix when no auth stack is detected', () => {
      const route = buildRouteFile()
      const result = unprotectedApiRoute.check(route, buildContext())
      expect(result[0]?.fix.description).toContain('authentication check')
    })

    it('returns next-auth specific fix when next-auth is detected', () => {
      const route = buildRouteFile()
      const context = buildContext({ detectedStack: { auth: 'next-auth' } })
      const result = unprotectedApiRoute.check(route, context)
      expect(result[0]?.fix.description).toContain('getServerSession')
      expect(result[0]?.fix.codeExample).toContain('getServerSession')
    })

    it('returns clerk specific fix when clerk is detected', () => {
      const route = buildRouteFile()
      const context = buildContext({ detectedStack: { auth: 'clerk' } })
      const result = unprotectedApiRoute.check(route, context)
      expect(result[0]?.fix.description).toContain('auth()')
      expect(result[0]?.fix.codeExample).toContain('@clerk/nextjs')
    })

    it('returns supabase specific fix when supabase is detected', () => {
      const route = buildRouteFile()
      const context = buildContext({ detectedStack: { auth: 'supabase' } })
      const result = unprotectedApiRoute.check(route, context)
      expect(result[0]?.fix.description).toContain('getUser()')
    })

    it('always returns low effort', () => {
      const route = buildRouteFile()
      const result = unprotectedApiRoute.check(route, buildContext())
      expect(result[0]?.fix.effort).toBe('low')
    })
  })
})
