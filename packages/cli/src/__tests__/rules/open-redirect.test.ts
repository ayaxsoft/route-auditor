import { describe, it, expect } from 'vitest'
import { openRedirect } from '../../rules/open-redirect'
import type { RouteFile, AuditContext } from '../../types'

const buildRouteFile = (overrides: Partial<RouteFile> = {}): RouteFile => ({
  projectRoot: '/project',
  filePath: '/project/app/login/page.tsx',
  routePath: '/login',
  routerType: 'app',
  isApiRoute: false,
  isDynamic: false,
  dynamicSegments: [],
  hasCatchAll: false,
  hasOptionalCatchAll: false,
  methods: [],
  exports: ['default'],
  rawContent: "const callbackUrl = searchParams.get('callbackUrl')\nredirect(callbackUrl)",
  ...overrides,
})

const buildContext = (): AuditContext => ({
  projectRoot: '/project',
  routerType: 'app',
  detectedStack: {},
  config: {},
  allRoutes: [],
})

describe('openRedirect', () => {
  describe('when route has no redirect calls', () => {
    it('returns no vulnerabilities', () => {
      const route = buildRouteFile({ rawContent: 'export default function Page() {}' })
      const result = openRedirect.check(route, buildContext())
      expect(result).toHaveLength(0)
    })
  })

  describe('when redirect uses hardcoded paths', () => {
    it('returns no vulnerabilities for literal redirect', () => {
      const route = buildRouteFile({ rawContent: "redirect('/dashboard')" })
      const result = openRedirect.check(route, buildContext())
      expect(result).toHaveLength(0)
    })
  })

  describe('when redirect uses user-controlled input', () => {
    it.each([
      ['searchParams', "redirect(searchParams.get('callbackUrl'))"],
      ['params.callbackUrl', 'redirect(params.callbackUrl)'],
      ['callbackUrl variable', 'const callbackUrl = x\nredirect(callbackUrl)'],
      ['returnUrl', 'redirect(returnUrl)'],
      ['redirectUrl', 'redirect(redirectUrl)'],
      ['redirectTo', 'redirect(redirectTo)'],
      ['next variable', 'redirect(next)'],
      ['url variable', 'redirect(url)'],
      ['href variable', 'redirect(href)'],
      ['destination', 'redirect(destination)'],
      ['target', 'redirect(target)'],
      ['req.query', 'redirect(req.query.next)'],
      ['template literal', 'redirect(`/app/${path}`)'],
    ])('returns a vulnerability for redirect using %s', (_, rawContent) => {
      const route = buildRouteFile({ rawContent })
      const result = openRedirect.check(route, buildContext())
      expect(result).toHaveLength(1)
      expect(result[0]?.id).toBe('RW-REDIRECT-001')
      expect(result[0]?.severity).toBe('medium')
    })
  })

  describe('when redirect has a safety guard', () => {
    it.each([
      ['startsWith check', "if (!url.startsWith('/')) throw new Error()\nredirect(url)"],
      ['new URL validation', 'const parsed = new URL(callbackUrl)\nredirect(callbackUrl)'],
      ['isValidUrl guard', 'if (!isValidUrl(url)) return\nredirect(url)'],
      ['ALLOWED_REDIRECTS list', 'ALLOWED_REDIRECTS.includes(url)\nredirect(url)'],
    ])('returns no vulnerabilities when route uses %s', (_, rawContent) => {
      const route = buildRouteFile({ rawContent })
      const result = openRedirect.check(route, buildContext())
      expect(result).toHaveLength(0)
    })
  })

  describe('vulnerability details', () => {
    it('includes the route path in the description', () => {
      const route = buildRouteFile({ routePath: '/auth/callback' })
      const result = openRedirect.check(route, buildContext())
      expect(result[0]?.description).toContain('/auth/callback')
    })

    it('references startsWith in the fix', () => {
      const result = openRedirect.check(buildRouteFile(), buildContext())
      expect(result[0]?.fix.description).toContain("'/'")
      expect(result[0]?.fix.codeExample).toContain("startsWith('/')")
    })

    it('works for both API routes and page routes', () => {
      const apiRoute = buildRouteFile({ isApiRoute: true })
      const pageRoute = buildRouteFile({ isApiRoute: false })
      expect(openRedirect.check(apiRoute, buildContext())).toHaveLength(1)
      expect(openRedirect.check(pageRoute, buildContext())).toHaveLength(1)
    })
  })
})
