import { describe, it, expect } from 'vitest'
import { isPublicApiRoute } from '../../utils/detect-public-api-route'
import type { RouteFile } from '../../types'

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

describe('isPublicApiRoute', () => {
  describe('regular API routes', () => {
    it('returns false for a standard API route', () => {
      expect(isPublicApiRoute(buildRouteFile())).toBe(false)
    })

    it('returns false for a route with auth logic', () => {
      expect(
        isPublicApiRoute(
          buildRouteFile({
            rawContent: 'const session = await getServerSession(authOptions)',
          }),
        ),
      ).toBe(false)
    })
  })

  describe('auth handler routes', () => {
    it('returns true for a NextAuth v4 handler', () => {
      expect(
        isPublicApiRoute(
          buildRouteFile({
            routePath: '/api/auth/[...nextauth]',
            rawContent: `
              import NextAuth from 'next-auth'
              import { authOptions } from '@/lib/auth'
              const handler = NextAuth(authOptions)
              export { handler as GET, handler as POST }
            `,
          }),
        ),
      ).toBe(true)
    })

    it('returns true for a Better Auth handler using toNextJsHandler', () => {
      expect(
        isPublicApiRoute(
          buildRouteFile({
            routePath: '/api/auth/[...all]',
            rawContent: `
              import { auth } from '@/lib/auth'
              import { toNextJsHandler } from 'better-auth/next-js'
              export const { GET, POST } = toNextJsHandler(auth.handler)
            `,
          }),
        ),
      ).toBe(true)
    })

    it('returns true for an Auth.js v5 handler re-exporting handlers', () => {
      const handlersGET = 'handlers.GET'
      expect(
        isPublicApiRoute(
          buildRouteFile({
            routePath: '/api/auth/[...all]',
            rawContent: `
              import { handlers } from '@/auth'
              export const { GET, POST } = handlers
              // ${handlersGET}
            `,
          }),
        ),
      ).toBe(true)
    })

    it('returns true for a Clerk handler using createNextHandler', () => {
      expect(
        isPublicApiRoute(
          buildRouteFile({
            routePath: '/api/auth/[...all]',
            rawContent: `
              import { createNextHandler } from '@clerk/nextjs/server'
              export const GET = createNextHandler()
              export const POST = createNextHandler()
            `,
          }),
        ),
      ).toBe(true)
    })

    it('returns false when path is /api/auth/ but no known handler signature is present', () => {
      expect(
        isPublicApiRoute(
          buildRouteFile({
            routePath: '/api/auth/[...all]',
            rawContent: 'export async function GET() { return Response.json({}) }',
          }),
        ),
      ).toBe(false)
    })

    it('returns false when handler signature is present but path is not under /api/auth/', () => {
      expect(
        isPublicApiRoute(
          buildRouteFile({
            routePath: '/api/custom/[...all]',
            rawContent: `
              import NextAuth from 'next-auth'
              const handler = NextAuth(authOptions)
              export { handler as GET, handler as POST }
            `,
          }),
        ),
      ).toBe(false)
    })
  })

  describe('tRPC handler routes', () => {
    it('returns true for a tRPC route using fetchRequestHandler', () => {
      expect(
        isPublicApiRoute(
          buildRouteFile({
            routePath: '/api/trpc/[trpc]',
            rawContent: `
              import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
              import { appRouter } from '@/server/api/root'
              export async function GET(req: Request) {
                return fetchRequestHandler({ endpoint: '/api/trpc', req, router: appRouter })
              }
            `,
          }),
        ),
      ).toBe(true)
    })

    it('returns true for a tRPC catch-all route using createNextApiHandler', () => {
      expect(
        isPublicApiRoute(
          buildRouteFile({
            routePath: '/api/trpc/[...trpc]',
            rawContent: `
              import { createNextApiHandler } from '@trpc/server/adapters/next'
              export default createNextApiHandler({ router: appRouter })
            `,
          }),
        ),
      ).toBe(true)
    })

    it('returns true for a tRPC route with direct @trpc/server import', () => {
      expect(
        isPublicApiRoute(
          buildRouteFile({
            routePath: '/api/trpc/[trpc]',
            rawContent: `import { initTRPC } from '@trpc/server'`,
          }),
        ),
      ).toBe(true)
    })

    it('returns false when path is /api/trpc/ but no tRPC signature is present', () => {
      expect(
        isPublicApiRoute(
          buildRouteFile({
            routePath: '/api/trpc/[trpc]',
            rawContent: 'export async function GET() { return Response.json({}) }',
          }),
        ),
      ).toBe(false)
    })

    it('returns false when tRPC signature is present but path is not under /api/trpc/', () => {
      expect(
        isPublicApiRoute(
          buildRouteFile({
            routePath: '/api/custom/[trpc]',
            rawContent: `import { fetchRequestHandler } from '@trpc/server/adapters/fetch'`,
          }),
        ),
      ).toBe(false)
    })
  })
})
