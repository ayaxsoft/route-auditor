import { describe, it, expect } from 'vitest'
import { exposedEnvVariable } from '../../rules/exposed-env-variable'
import type { RouteFile, AuditContext } from '../../types'

const buildRouteFile = (overrides: Partial<RouteFile> = {}): RouteFile => ({
  projectRoot: '/project',
  filePath: '/project/app/api/config/route.ts',
  routePath: '/api/config',
  routerType: 'app',
  isApiRoute: true,
  isDynamic: false,
  dynamicSegments: [],
  hasCatchAll: false,
  hasOptionalCatchAll: false,
  methods: ['GET'],
  exports: ['GET'],
  rawContent: `export async function GET() {\n  return Response.json({ key: process.env.SECRET_KEY })\n}`,
  ...overrides,
})

const buildContext = (): AuditContext => ({
  projectRoot: '/project',
  routerType: 'app',
  detectedStack: {},
  config: {},
  allRoutes: [],
})

describe('exposedEnvVariable', () => {
  describe('when route is not an API route', () => {
    it('returns no vulnerabilities', () => {
      const result = exposedEnvVariable.check(buildRouteFile({ isApiRoute: false }), buildContext())
      expect(result).toHaveLength(0)
    })
  })

  describe('when route has no response output', () => {
    it('returns no vulnerabilities', () => {
      const route = buildRouteFile({
        rawContent: 'const secret = process.env.SECRET_KEY\nconsole.log(secret)',
      })
      const result = exposedEnvVariable.check(route, buildContext())
      expect(result).toHaveLength(0)
    })
  })

  describe('when route has no sensitive env vars', () => {
    it('returns no vulnerabilities for NEXT_PUBLIC_ vars', () => {
      const route = buildRouteFile({
        rawContent: `export async function GET() {\n  return Response.json({ url: process.env.NEXT_PUBLIC_API_URL })\n}`,
      })
      const result = exposedEnvVariable.check(route, buildContext())
      expect(result).toHaveLength(0)
    })

    it('returns no vulnerabilities for non-sensitive vars', () => {
      const route = buildRouteFile({
        rawContent: `export async function GET() {\n  return Response.json({ env: process.env.NODE_ENV })\n}`,
      })
      const result = exposedEnvVariable.check(route, buildContext())
      expect(result).toHaveLength(0)
    })
  })

  describe('when route accesses sensitive env vars', () => {
    it.each([
      ['SECRET_KEY', 'process.env.SECRET_KEY'],
      ['DATABASE_URL', 'process.env.DATABASE_URL'],
      ['DB_PASSWORD', 'process.env.DB_PASSWORD'],
      ['API_TOKEN', 'process.env.API_TOKEN'],
      ['STRIPE_API_KEY', 'process.env.STRIPE_API_KEY'],
      ['WEBHOOK_SECRET', 'process.env.WEBHOOK_SECRET'],
      ['PRIVATE_KEY', 'process.env.PRIVATE_KEY'],
      ['APP_SECRET', 'process.env.APP_SECRET'],
      ['USER_PASSWORD', 'process.env.USER_PASSWORD'],
      ['ENCRYPTION_KEY', 'process.env.ENCRYPTION_KEY'],
    ])('returns a vulnerability when route accesses %s', (_, envAccess) => {
      const route = buildRouteFile({
        rawContent: `export async function GET() {\n  const val = ${envAccess}\n  return Response.json({ data: val })\n}`,
      })
      const result = exposedEnvVariable.check(route, buildContext())
      expect(result).toHaveLength(1)
      expect(result[0]?.id).toBe('RW-ENV-001')
      expect(result[0]?.severity).toBe('high')
      expect(result[0]?.category).toBe('exposure')
    })

    it('includes the env variable name in the description', () => {
      const result = exposedEnvVariable.check(buildRouteFile(), buildContext())
      expect(result[0]?.description).toContain('SECRET_KEY')
    })

    it('includes the env variable name in the fix description', () => {
      const result = exposedEnvVariable.check(buildRouteFile(), buildContext())
      expect(result[0]?.fix.description).toContain('SECRET_KEY')
    })

    it('detects multiple sensitive vars in the same route', () => {
      const route = buildRouteFile({
        rawContent: `export async function GET() {\n  const a = process.env.SECRET_KEY\n  const b = process.env.DATABASE_URL\n  return Response.json({})\n}`,
      })
      const result = exposedEnvVariable.check(route, buildContext())
      expect(result).toHaveLength(1)
      expect(result[0]?.description).toContain('SECRET_KEY')
      expect(result[0]?.description).toContain('DATABASE_URL')
    })
  })

  describe('response output detection', () => {
    it.each([
      ['Response.json(', 'return Response.json({})'],
      ['NextResponse.json(', 'return NextResponse.json({})'],
      ['res.json(', 'res.json({})'],
      ['res.send(', 'res.send({})'],
      ['return {', 'return { data }'],
    ])('detects response via %s', (_, responseCode) => {
      const route = buildRouteFile({
        rawContent: `export async function GET() {\n  const val = process.env.SECRET_KEY\n  ${responseCode}\n}`,
      })
      const result = exposedEnvVariable.check(route, buildContext())
      expect(result).toHaveLength(1)
    })
  })
})
