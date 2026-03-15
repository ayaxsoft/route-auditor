import { describe, it, expect } from 'vitest'
import { missingWebhookVerification } from '../../rules/missing-webhook-verification'
import type { RouteFile, AuditContext } from '../../types'

const buildRouteFile = (overrides: Partial<RouteFile> = {}): RouteFile => ({
  projectRoot: '/project',
  filePath: '/project/app/api/webhooks/stripe/route.ts',
  routePath: '/api/webhooks/stripe',
  routerType: 'app',
  isApiRoute: true,
  isDynamic: false,
  dynamicSegments: [],
  hasCatchAll: false,
  hasOptionalCatchAll: false,
  methods: ['POST'],
  exports: ['POST'],
  rawContent: 'export async function POST(req: Request) { const body = await req.json() }',
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

describe('missingWebhookVerification', () => {
  describe('when route is not an API route', () => {
    it('returns no vulnerabilities', () => {
      const route = buildRouteFile({ isApiRoute: false })
      expect(missingWebhookVerification.check(route, buildContext())).toHaveLength(0)
    })
  })

  describe('when route is not a webhook route', () => {
    it('returns no vulnerabilities', () => {
      const route = buildRouteFile({ routePath: '/api/users' })
      expect(missingWebhookVerification.check(route, buildContext())).toHaveLength(0)
    })
  })

  describe('when webhook route does not have POST method', () => {
    it('returns no vulnerabilities', () => {
      const route = buildRouteFile({ methods: ['GET'] })
      expect(missingWebhookVerification.check(route, buildContext())).toHaveLength(0)
    })
  })

  describe('when webhook route has no signature verification', () => {
    it('returns a vulnerability for /api/webhooks route', () => {
      const result = missingWebhookVerification.check(buildRouteFile(), buildContext())
      expect(result).toHaveLength(1)
      expect(result[0]?.id).toBe('RW-WEBHOOK-001')
      expect(result[0]?.severity).toBe('high')
    })

    it.each([
      ['/api/webhook/github', '/api/webhook/github'],
      ['/api/webhooks/stripe', '/api/webhooks/stripe'],
      ['/api/webhook', '/api/webhook'],
    ])('returns a vulnerability for %s', (_, routePath) => {
      const route = buildRouteFile({ routePath })
      expect(missingWebhookVerification.check(route, buildContext())).toHaveLength(1)
    })
  })

  describe('when webhook route has signature verification', () => {
    it.each([
      ['createHmac', 'const hmac = createHmac("sha256", secret)'],
      ['timingSafeEqual', 'timingSafeEqual(Buffer.from(sig), Buffer.from(expected))'],
      ['stripe-signature', 'const sig = req.headers.get("stripe-signature")'],
      ['x-hub-signature', 'const sig = req.headers.get("x-hub-signature")'],
      ['svix-signature', 'const sig = req.headers.get("svix-signature")'],
      ['constructEvent', 'stripe.webhooks.constructEvent(body, sig, secret)'],
      ['verifyWebhook', 'await verifyWebhook(req, secret)'],
      ['Webhook(', 'const webhook = new Webhook(secret)'],
    ])('returns no vulnerabilities when route uses %s', (_, rawContent) => {
      const route = buildRouteFile({ rawContent })
      expect(missingWebhookVerification.check(route, buildContext())).toHaveLength(0)
    })
  })

  describe('fix suggestion', () => {
    it('includes createHmac and timingSafeEqual in the code example', () => {
      const result = missingWebhookVerification.check(buildRouteFile(), buildContext())
      expect(result[0]?.fix.codeExample).toContain('createHmac')
      expect(result[0]?.fix.codeExample).toContain('timingSafeEqual')
    })

    it('always returns low effort', () => {
      const result = missingWebhookVerification.check(buildRouteFile(), buildContext())
      expect(result[0]?.fix.effort).toBe('low')
    })
  })
})
