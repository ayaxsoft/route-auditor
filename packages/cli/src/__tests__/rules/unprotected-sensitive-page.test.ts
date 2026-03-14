import { describe, it, expect } from 'vitest'
import { unprotectedSensitivePage } from '../../rules/unprotected-sensitive-page'
import type { RouteFile, AuditContext } from '../../types'

const buildRouteFile = (overrides: Partial<RouteFile> = {}): RouteFile => ({
  projectRoot: '/project',
  filePath: '/project/app/admin/page.tsx',
  routePath: '/admin',
  routerType: 'app',
  isApiRoute: false,
  isDynamic: false,
  dynamicSegments: [],
  hasCatchAll: false,
  hasOptionalCatchAll: false,
  methods: [],
  exports: ['default'],
  rawContent: 'export default function Page() { return <div>Admin</div> }',
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

describe('unprotectedSensitivePage', () => {
  describe('when route is an API route', () => {
    it('returns no vulnerabilities', () => {
      const result = unprotectedSensitivePage.check(
        buildRouteFile({ isApiRoute: true }),
        buildContext(),
      )
      expect(result).toHaveLength(0)
    })
  })

  describe('when route is pages router', () => {
    it('returns no vulnerabilities', () => {
      const result = unprotectedSensitivePage.check(
        buildRouteFile({ routerType: 'pages' }),
        buildContext(),
      )
      expect(result).toHaveLength(0)
    })
  })

  describe('when route path is not sensitive', () => {
    it('returns no vulnerabilities for public pages', () => {
      const route = buildRouteFile({ routePath: '/about' })
      const result = unprotectedSensitivePage.check(route, buildContext())
      expect(result).toHaveLength(0)
    })

    it('returns no vulnerabilities for the home page', () => {
      const route = buildRouteFile({ routePath: '/' })
      const result = unprotectedSensitivePage.check(route, buildContext())
      expect(result).toHaveLength(0)
    })
  })

  describe('when route path is sensitive', () => {
    it.each([
      'admin',
      'dashboard',
      'settings',
      'profile',
      'account',
      'billing',
      'manage',
      'panel',
      'console',
      'backoffice',
      'portal',
      'internal',
    ])('returns a vulnerability for /%s path', (segment) => {
      const route = buildRouteFile({ routePath: `/${segment}` })
      const result = unprotectedSensitivePage.check(route, buildContext())
      expect(result).toHaveLength(1)
      expect(result[0]?.id).toBe('RW-AUTH-003')
      expect(result[0]?.severity).toBe('high')
      expect(result[0]?.category).toBe('authentication')
    })

    it('detects sensitive segment in nested paths', () => {
      const route = buildRouteFile({ routePath: '/app/admin/users' })
      const result = unprotectedSensitivePage.check(route, buildContext())
      expect(result).toHaveLength(1)
    })
  })

  describe('when page has auth checks', () => {
    it('returns no vulnerabilities when getServerSession is present', () => {
      const route = buildRouteFile({
        rawContent:
          'const session = await getServerSession(authOptions)\nif (!session) redirect("/login")',
      })
      const result = unprotectedSensitivePage.check(route, buildContext())
      expect(result).toHaveLength(0)
    })

    it('returns no vulnerabilities when redirect is present', () => {
      const route = buildRouteFile({
        rawContent: "import { redirect } from 'next/navigation'\nif (!session) redirect('/login')",
      })
      const result = unprotectedSensitivePage.check(route, buildContext())
      expect(result).toHaveLength(0)
    })

    it('returns no vulnerabilities when clerk auth() is present', () => {
      const route = buildRouteFile({
        rawContent: "const { userId } = auth()\nif (!userId) redirect('/sign-in')",
      })
      const context = buildContext({ detectedStack: { auth: 'clerk' } })
      const result = unprotectedSensitivePage.check(route, context)
      expect(result).toHaveLength(0)
    })

    it('returns no vulnerabilities when next-auth getServerSession is present', () => {
      const route = buildRouteFile({
        rawContent: 'const session = await getServerSession(authOptions)',
      })
      const context = buildContext({ detectedStack: { auth: 'next-auth' } })
      const result = unprotectedSensitivePage.check(route, context)
      expect(result).toHaveLength(0)
    })
  })

  describe('fix suggestion', () => {
    it('returns stack-specific fix when next-auth is detected', () => {
      const context = buildContext({ detectedStack: { auth: 'next-auth' } })
      const result = unprotectedSensitivePage.check(buildRouteFile(), context)
      expect(result[0]?.fix.description).toContain('getServerSession()')
      expect(result[0]?.fix.codeExample).toContain('getServerSession')
    })

    it('returns stack-specific fix when clerk is detected', () => {
      const context = buildContext({ detectedStack: { auth: 'clerk' } })
      const result = unprotectedSensitivePage.check(buildRouteFile(), context)
      expect(result[0]?.fix.description).toContain('auth()')
      expect(result[0]?.fix.codeExample).toContain('@clerk/nextjs')
    })

    it('returns generic fix when no auth stack is detected', () => {
      const result = unprotectedSensitivePage.check(buildRouteFile(), buildContext())
      expect(result[0]?.fix.description).toContain('redirect to login')
      expect(result[0]?.fix.codeExample).toContain('redirect')
    })

    it('always returns low effort', () => {
      const result = unprotectedSensitivePage.check(buildRouteFile(), buildContext())
      expect(result[0]?.fix.effort).toBe('low')
    })
  })
})
