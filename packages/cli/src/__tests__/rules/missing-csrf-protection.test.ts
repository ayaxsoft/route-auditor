import { describe, it, expect } from 'vitest'
import { missingCsrfProtection } from '../../rules/missing-csrf-protection'
import type { RouteFile, AuditContext } from '../../types'

const buildRouteFile = (overrides: Partial<RouteFile> = {}): RouteFile => ({
  projectRoot: '/project',
  filePath: '/project/app/actions.ts',
  routePath: '/dashboard',
  routerType: 'app',
  isApiRoute: false,
  isDynamic: false,
  dynamicSegments: [],
  hasCatchAll: false,
  hasOptionalCatchAll: false,
  methods: [],
  exports: [],
  rawContent: "'use server'\n\nexport async function deleteUser(id: string) {}",
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

describe('missingCsrfProtection', () => {
  describe('when route is not app router', () => {
    it('returns no vulnerabilities for pages router files', () => {
      const route = buildRouteFile({ routerType: 'pages' })
      const result = missingCsrfProtection.check(route, buildContext())
      expect(result).toHaveLength(0)
    })
  })

  describe('when file has no server actions', () => {
    it('returns no vulnerabilities when use server directive is absent', () => {
      const route = buildRouteFile({ rawContent: 'export async function handler() {}' })
      const result = missingCsrfProtection.check(route, buildContext())
      expect(result).toHaveLength(0)
    })
  })

  describe('when file has server actions without protection', () => {
    it('returns a vulnerability for single-quoted use server', () => {
      const route = buildRouteFile({
        rawContent: "'use server'\nexport async function create() {}",
      })
      const result = missingCsrfProtection.check(route, buildContext())
      expect(result).toHaveLength(1)
      expect(result[0]?.id).toBe('RW-AUTH-002')
      expect(result[0]?.severity).toBe('medium')
    })

    it('returns a vulnerability for double-quoted use server', () => {
      const route = buildRouteFile({
        rawContent: '"use server"\nexport async function create() {}',
      })
      const result = missingCsrfProtection.check(route, buildContext())
      expect(result).toHaveLength(1)
    })

    it('returns a vulnerability for inline use server in a function', () => {
      const route = buildRouteFile({
        rawContent: "export async function submit() {\n  'use server'\n  // action\n}",
      })
      const result = missingCsrfProtection.check(route, buildContext())
      expect(result).toHaveLength(1)
    })
  })

  describe('when CSRF protection is present', () => {
    it.each([
      ['next-safe-action import', "import { createSafeActionClient } from 'next-safe-action'"],
      ['next-safe-action string', "require('next-safe-action')"],
      ['createServerAction', 'const action = createServerAction()'],
      ['createActionClient', 'createActionClient()'],
      ['x-csrf-token header', "req.headers.get('x-csrf-token')"],
      ['csrf-token check', 'const csrfToken = getCsrfToken()'],
      ['csrfToken variable', 'const csrfToken = req.headers.csrfToken'],
    ])('returns no vulnerabilities when file uses %s', (_, protection) => {
      const route = buildRouteFile({
        rawContent: `'use server'\n${protection}\nexport async function create() {}`,
      })
      const result = missingCsrfProtection.check(route, buildContext())
      expect(result).toHaveLength(0)
    })
  })

  describe('vulnerability details', () => {
    it('includes the route path in the description', () => {
      const route = buildRouteFile({ routePath: '/dashboard/settings' })
      const result = missingCsrfProtection.check(route, buildContext())
      expect(result[0]?.description).toContain('/dashboard/settings')
    })

    it('references next-safe-action in the fix', () => {
      const route = buildRouteFile()
      const result = missingCsrfProtection.check(route, buildContext())
      expect(result[0]?.fix.description).toContain('next-safe-action')
      expect(result[0]?.fix.codeExample).toContain('createSafeActionClient')
    })

    it('sets effort to low', () => {
      const route = buildRouteFile()
      const result = missingCsrfProtection.check(route, buildContext())
      expect(result[0]?.fix.effort).toBe('low')
    })
  })
})
