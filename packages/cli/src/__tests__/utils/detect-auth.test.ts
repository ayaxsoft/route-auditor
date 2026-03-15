import { describe, it, expect, beforeAll, vi } from 'vitest'
import { detectsAuth } from '../../utils/detect-auth'
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

describe('detectAuth', () => {
  beforeAll(() => {
    vi.clearAllMocks()
  })

  describe('when auth stack is detected', () => {
    it('returns true when auth signature is present', () => {
      const route = buildRouteFile({
        rawContent: 'const session = await getServerSession(authOptions)',
      })
      const context = buildContext({ detectedStack: { auth: 'next-auth' } })
      expect(detectsAuth(route, context, ['getServerSession'])).toBe(true)
    })

    it('returns true when auth signature is present in the raw content', () => {
      const route = buildRouteFile({
        rawContent: 'const session = await getServerSession(authOptions)',
      })
      const context = buildContext({ detectedStack: { auth: 'next-auth' } })
      expect(detectsAuth(route, context, ['getServerSession'])).toBe(true)
    })

    it('returns false when auth signature is not present in the raw content', () => {
      const route = buildRouteFile({
        rawContent: 'export async function GET() { return Response.json({}) }',
      })
      const context = buildContext({ detectedStack: { auth: 'next-auth' } })
      expect(detectsAuth(route, context, ['getServerSession'])).toBe(false)
    })
  })

  describe('when auth stack is not detected', () => {
    it('returns true when auth signature is present in the raw content', () => {
      const route = buildRouteFile({
        rawContent: 'const session = await getServerSession(authOptions)',
      })
      const context = buildContext({ detectedStack: { auth: 'next-auth' } })
      expect(detectsAuth(route, context, ['getServerSession'])).toBe(true)
    })

    it('returns false when auth signature is not present in the raw content', () => {
      const route = buildRouteFile({
        rawContent: 'export async function GET() { return Response.json({}) }',
      })
      const context = buildContext({ detectedStack: { auth: 'next-auth' } })
      expect(detectsAuth(route, context, ['getServerSession'])).toBe(false)
    })

    it('returns true when auth signature is present in the raw content and auth stack is not detected', () => {
      const route = buildRouteFile({
        rawContent: 'const session = await getServerSession(authOptions)',
      })
      const context = buildContext({ detectedStack: { auth: 'next-auth' } })
      expect(detectsAuth(route, context, ['getServerSession'])).toBe(true)
    })

    it('returns false when auth signature is not present in the raw content and auth stack is not detected', () => {
      const route = buildRouteFile({
        rawContent: 'export async function GET() { return Response.json({}) }',
      })
      const context = buildContext({ detectedStack: { auth: 'next-auth' } })
      expect(detectsAuth(route, context, ['getServerSession'])).toBe(false)
    })

    it('returns true when auth signature is present in the raw content and auth stack is not detected', () => {
      const route = buildRouteFile({
        rawContent: 'const session = await getServerSession(authOptions)',
      })
      const context = buildContext({ detectedStack: { auth: 'next-auth' } })
      expect(detectsAuth(route, context, ['getServerSession'])).toBe(true)
    })

    it('returns false when auth signature is not present in the raw content and auth stack is not detected', () => {
      const route = buildRouteFile({
        rawContent: 'export async function GET() { return Response.json({}) }',
      })
      const context = buildContext({ detectedStack: { auth: 'next-auth' } })
      expect(detectsAuth(route, context, ['getServerSession'])).toBe(false)
    })
  })
})
