import { describe, it, expect } from 'vitest'
import { hardcodedSecret } from '../../rules/hardcoded-secret'
import type { RouteFile, AuditContext } from '../../types'

const buildRouteFile = (overrides: Partial<RouteFile> = {}): RouteFile => ({
  projectRoot: '/project',
  filePath: '/project/app/api/payments/route.ts',
  routePath: '/api/payments',
  routerType: 'app',
  isApiRoute: true,
  isDynamic: false,
  dynamicSegments: [],
  hasCatchAll: false,
  hasOptionalCatchAll: false,
  methods: ['POST'],
  exports: ['POST'],
  rawContent: 'export async function POST() { return Response.json({}) }',
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

describe('hardcodedSecret', () => {
  describe('when route has no hardcoded secrets', () => {
    it('returns no vulnerabilities for a clean route', () => {
      expect(hardcodedSecret.check(buildRouteFile(), buildContext())).toHaveLength(0)
    })

    it('returns no vulnerabilities when secrets come from process.env', () => {
      const route = buildRouteFile({
        rawContent: 'const apiKey = process.env.STRIPE_SECRET_KEY',
      })
      expect(hardcodedSecret.check(route, buildContext())).toHaveLength(0)
    })

    it('returns no vulnerabilities when secrets come from import.meta.env', () => {
      const route = buildRouteFile({
        rawContent: 'const apiKey = import.meta.env.API_KEY',
      })
      expect(hardcodedSecret.check(route, buildContext())).toHaveLength(0)
    })

    it('returns no vulnerabilities for commented-out secrets', () => {
      const route = buildRouteFile({
        rawContent: "// const secret = 'hardcoded-value-here'",
      })
      expect(hardcodedSecret.check(route, buildContext())).toHaveLength(0)
    })
  })

  describe('when route has secrets hardcoded by variable name', () => {
    it.each([
      ['secret', "const secret = 'super-secret-value-123'"],
      ['apikey', "const apikey = 'abcdefghijklmnop'"],
      ['api_key', "const api_key = 'abcdefghijklmnop'"],
      ['password', "const password = 'mypassword123!'"],
      ['auth_token', "const auth_token = 'token-value-here'"],
      ['access_token', "const access_token = 'access-token-value'"],
      ['client_secret', "const client_secret = 'client-secret-value'"],
      ['private_key', "const private_key = 'private-key-value-123'"],
    ])('returns a vulnerability for hardcoded %s', (_, rawContent) => {
      const route = buildRouteFile({ rawContent })
      const result = hardcodedSecret.check(route, buildContext())
      expect(result).toHaveLength(1)
      expect(result[0]?.id).toBe('RW-SECRET-001')
      expect(result[0]?.severity).toBe('critical')
    })
  })

  describe('when route has known secret patterns', () => {
    const fakeSecret = (prefix: string, suffix: string): string => prefix + suffix

    it.each([
      ['Stripe live key', fakeSecret('sk_live_', 'abcdefghijklmnopqrstuvwx')],
      ['Stripe test key', fakeSecret('sk_test_', 'abcdefghijklmnopqrstuvwx')],
      ['GitHub personal token', fakeSecret('ghp_', 'abcdefghijklmnopqrstuvwxyz123456789')],
      ['GitHub app token', fakeSecret('ghs_', 'abcdefghijklmnopqrstuvwxyz123456789')],
      ['AWS access key', fakeSecret('AKIA', 'IOSFODNN7EXAMPLE')],
      ['Google API key', fakeSecret('AIza', 'SyDummyKeyForTestingPurposesOnly123')],
    ])('returns a vulnerability for %s', (_, rawContent) => {
      const route = buildRouteFile({ rawContent })
      const result = hardcodedSecret.check(route, buildContext())
      expect(result).toHaveLength(1)
      expect(result[0]?.severity).toBe('critical')
    })
  })

  describe('fix suggestion', () => {
    it('recommends using process.env in the code example', () => {
      const route = buildRouteFile({ rawContent: "const secret = 'hardcoded-value-here'" })
      const result = hardcodedSecret.check(route, buildContext())
      expect(result[0]?.fix.codeExample).toContain('process.env')
    })

    it('always returns low effort', () => {
      const route = buildRouteFile({ rawContent: "const secret = 'hardcoded-value-here'" })
      const result = hardcodedSecret.check(route, buildContext())
      expect(result[0]?.fix.effort).toBe('low')
    })
  })
})
