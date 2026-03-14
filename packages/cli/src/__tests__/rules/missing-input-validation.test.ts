import { describe, it, expect } from 'vitest'
import { missingInputValidation } from '../../rules/missing-input-validation'
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
  methods: ['POST'],
  exports: ['POST'],
  rawContent:
    'export async function POST(req: Request) { const body = await req.json(); return Response.json(body) }',
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

describe('missingInputValidation', () => {
  describe('when route is not an API route', () => {
    it('returns no vulnerabilities', () => {
      const result = missingInputValidation.check(
        buildRouteFile({ isApiRoute: false }),
        buildContext(),
      )
      expect(result).toHaveLength(0)
    })
  })

  describe('when route has no mutation methods', () => {
    it('returns no vulnerabilities for GET-only routes', () => {
      const route = buildRouteFile({
        methods: ['GET'],
        rawContent: 'export async function GET() {}',
      })
      const result = missingInputValidation.check(route, buildContext())
      expect(result).toHaveLength(0)
    })
  })

  describe('when route does not parse a body', () => {
    it('returns no vulnerabilities when no body parsing is present', () => {
      const route = buildRouteFile({
        rawContent: 'export async function POST() { return Response.json({}) }',
      })
      const result = missingInputValidation.check(route, buildContext())
      expect(result).toHaveLength(0)
    })
  })

  describe('when route parses body without validation', () => {
    it.each([
      ['req.json()', 'const body = await req.json()'],
      ['request.json()', 'const body = await request.json()'],
      ['req.formData()', 'const form = await req.formData()'],
      ['request.formData()', 'const form = await request.formData()'],
      ['req.body', 'const body = req.body'],
    ])('returns a vulnerability when route uses %s', (_, rawContent) => {
      const route = buildRouteFile({
        rawContent: `export async function POST(req) { ${rawContent} }`,
      })
      const result = missingInputValidation.check(route, buildContext())
      expect(result).toHaveLength(1)
      expect(result[0]?.id).toBe('RW-INPUT-001')
      expect(result[0]?.severity).toBe('medium')
      expect(result[0]?.category).toBe('injection')
    })

    it.each(['POST', 'PUT', 'PATCH'])('returns a vulnerability for %s method', (method) => {
      const route = buildRouteFile({ methods: [method as 'POST' | 'PUT' | 'PATCH'] })
      const result = missingInputValidation.check(route, buildContext())
      expect(result).toHaveLength(1)
    })
  })

  describe('when route has input validation', () => {
    it.each([
      ['zod safeParse', 'const result = schema.safeParse(body)'],
      ['zod parse', 'const data = schema.parse(body)'],
      ['zod object', 'const schema = z.object({ name: z.string() })'],
      ['yup validate', 'await schema.validate(body)'],
      ['joi validate', 'schema.validate(body)'],
      ['valibot safeParse', 'v.safeParse(schema, body)'],
      ['valibot object', 'const schema = v.object({})'],
      ['next-safe-action', "import { createSafeActionClient } from 'next-safe-action'"],
    ])('returns no vulnerabilities when route uses %s', (_, validation) => {
      const route = buildRouteFile({
        rawContent: `export async function POST(req) { const body = await req.json(); ${validation} }`,
      })
      const result = missingInputValidation.check(route, buildContext())
      expect(result).toHaveLength(0)
    })
  })

  describe('fix suggestion', () => {
    it('returns zod-specific fix when zod is in the stack', () => {
      const context = buildContext({ detectedStack: { validation: 'zod' } })
      const result = missingInputValidation.check(buildRouteFile(), context)
      expect(result[0]?.fix.description).toContain('Zod')
      expect(result[0]?.fix.codeExample).toContain('safeParse')
    })

    it('returns yup-specific fix when yup is in the stack', () => {
      const context = buildContext({ detectedStack: { validation: 'yup' } })
      const result = missingInputValidation.check(buildRouteFile(), context)
      expect(result[0]?.fix.description).toContain('Yup')
    })

    it('returns joi-specific fix when joi is in the stack', () => {
      const context = buildContext({ detectedStack: { validation: 'joi' } })
      const result = missingInputValidation.check(buildRouteFile(), context)
      expect(result[0]?.fix.description).toContain('Joi')
    })

    it('returns valibot-specific fix when valibot is in the stack', () => {
      const context = buildContext({ detectedStack: { validation: 'valibot' } })
      const result = missingInputValidation.check(buildRouteFile(), context)
      expect(result[0]?.fix.description).toContain('Valibot')
    })

    it('returns generic fix when no validation stack is detected', () => {
      const result = missingInputValidation.check(buildRouteFile(), buildContext())
      expect(result[0]?.fix.description).toContain('Zod')
      expect(result[0]?.fix.codeExample).toBeUndefined()
    })

    it('always returns low effort', () => {
      const result = missingInputValidation.check(buildRouteFile(), buildContext())
      expect(result[0]?.fix.effort).toBe('low')
    })
  })
})
