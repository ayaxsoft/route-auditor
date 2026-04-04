import { describe, it, expect, vi } from 'vitest'
import { unprotectedSensitivePage } from '../../rules/unprotected-sensitive-page'
import type { RouteFile, AuditContext } from '../../types'

vi.mock('../../utils/detect-middleware', () => ({
  isRouteProtectedByMiddleware: vi.fn().mockReturnValue(false),
}))

vi.mock('../../utils/detect-proxy', () => ({
  isRouteProtectedByLayout: vi.fn().mockReturnValue(false),
}))

import { isRouteProtectedByMiddleware } from '../../utils/detect-middleware'
import { isRouteProtectedByLayout } from '../../utils/detect-proxy'

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

  describe('when route is protected by middleware or proxy', () => {
    it('returns no vulnerabilities when middleware protects the route', () => {
      vi.mocked(isRouteProtectedByMiddleware).mockReturnValue(true)
      const result = unprotectedSensitivePage.check(buildRouteFile(), buildContext())
      expect(result).toHaveLength(0)
      vi.mocked(isRouteProtectedByMiddleware).mockReturnValue(false)
    })

    it('returns no vulnerabilities when an ancestor layout protects the route', () => {
      vi.mocked(isRouteProtectedByLayout).mockReturnValue(true)
      const result = unprotectedSensitivePage.check(buildRouteFile(), buildContext())
      expect(result).toHaveLength(0)
      vi.mocked(isRouteProtectedByLayout).mockReturnValue(false)
    })

    it('passes projectRoot and routePath to isRouteProtectedByMiddleware', () => {
      unprotectedSensitivePage.check(buildRouteFile(), buildContext())
      expect(isRouteProtectedByMiddleware).toHaveBeenCalledWith('/project', '/admin')
    })

    it('passes filePath and projectRoot to isRouteProtectedByLayout', () => {
      unprotectedSensitivePage.check(buildRouteFile(), buildContext())
      expect(isRouteProtectedByLayout).toHaveBeenCalledWith(
        '/project/app/admin/page.tsx',
        '/project',
      )
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
