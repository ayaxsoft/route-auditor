import { describe, it, expect, vi, beforeEach } from 'vitest'
import { isRouteProtectedByMiddleware } from '../../utils/detect-middleware'

vi.mock('fs', () => ({
  existsSync: vi.fn(),
  readFileSync: vi.fn(),
}))

import { existsSync, readFileSync } from 'fs'

const mockFileExists = (filePath: string) => {
  vi.mocked(existsSync).mockImplementation((path) => path === filePath)
}

const mockFileContent = (content: string) => {
  vi.mocked(readFileSync).mockReturnValue(content)
}

beforeEach(() => {
  vi.resetAllMocks()
})

describe('isRouteProtectedByMiddleware', () => {
  describe('when no middleware or proxy file exists', () => {
    it('returns false', () => {
      vi.mocked(existsSync).mockReturnValue(false)
      expect(isRouteProtectedByMiddleware('/project', '/dashboard')).toBe(false)
    })
  })

  describe('when middleware file exists but has no auth logic', () => {
    it('returns false', () => {
      mockFileExists('/project/middleware.ts')
      mockFileContent(`
        import { NextResponse } from 'next/server'
        export function middleware() {
          return NextResponse.next()
        }
      `)
      expect(isRouteProtectedByMiddleware('/project', '/dashboard')).toBe(false)
    })
  })

  describe('proxy.ts (Next.js 16+)', () => {
    it('returns true when proxy.ts has auth logic and no matcher', () => {
      mockFileExists('/project/proxy.ts')
      mockFileContent(`
        import { auth } from '@/lib/auth'
        export async function proxy(request) {
          const session = await auth(request)
          if (!session) return NextResponse.redirect('/login')
        }
      `)
      expect(isRouteProtectedByMiddleware('/project', '/dashboard')).toBe(true)
    })

    it('returns true when src/proxy.ts has auth logic and no matcher', () => {
      mockFileExists('/project/src/proxy.ts')
      mockFileContent(`
        export async function proxy(request) {
          const token = await getToken({ req: request })
          if (!token) return NextResponse.redirect('/login')
        }
      `)
      expect(isRouteProtectedByMiddleware('/project', '/dashboard')).toBe(true)
    })
  })

  describe('middleware.ts (Next.js 12–15)', () => {
    it('returns true when middleware.ts has auth logic and no matcher', () => {
      mockFileExists('/project/middleware.ts')
      mockFileContent(`
        export async function middleware(request) {
          const session = await getServerSession(request)
          if (!session) return NextResponse.redirect('/login')
        }
      `)
      expect(isRouteProtectedByMiddleware('/project', '/dashboard')).toBe(true)
    })

    it('returns true when src/middleware.ts has auth logic and no matcher', () => {
      mockFileExists('/project/src/middleware.ts')
      mockFileContent(`
        export async function middleware(request) {
          const token = getToken(request)
          if (!token) return NextResponse.redirect('/login')
        }
      `)
      expect(isRouteProtectedByMiddleware('/project', '/admin')).toBe(true)
    })
  })

  describe('legacy pages/_middleware.ts (Next.js 12 early beta)', () => {
    it('returns true when _middleware.ts has auth logic and no matcher', () => {
      mockFileExists('/project/pages/_middleware.ts')
      mockFileContent(`
        export function middleware(request) {
          const session = request.cookies.get('session')
          if (!session) return NextResponse.redirect('/login')
        }
      `)
      expect(isRouteProtectedByMiddleware('/project', '/dashboard')).toBe(true)
    })
  })

  describe('matcher config', () => {
    describe('when no matcher is defined', () => {
      it('considers all routes as protected', () => {
        mockFileExists('/project/middleware.ts')
        mockFileContent(`
          export async function middleware(request) {
            const session = await getServerSession(request)
            if (!session) return NextResponse.redirect('/login')
          }
        `)
        expect(isRouteProtectedByMiddleware('/project', '/dashboard')).toBe(true)
        expect(isRouteProtectedByMiddleware('/project', '/admin/users')).toBe(true)
        expect(isRouteProtectedByMiddleware('/project', '/settings')).toBe(true)
      })
    })

    describe('when matcher is a single string', () => {
      it('returns true when route matches the pattern', () => {
        mockFileExists('/project/middleware.ts')
        mockFileContent(`
          export async function middleware(request) {
            const session = await getServerSession(request)
          }
          export const config = { matcher: '/dashboard/:path*' }
        `)
        expect(isRouteProtectedByMiddleware('/project', '/dashboard')).toBe(true)
        expect(isRouteProtectedByMiddleware('/project', '/dashboard/users')).toBe(true)
      })

      it('returns false when route does not match the pattern', () => {
        mockFileExists('/project/middleware.ts')
        mockFileContent(`
          export async function middleware(request) {
            const session = await getServerSession(request)
          }
          export const config = { matcher: '/dashboard/:path*' }
        `)
        expect(isRouteProtectedByMiddleware('/project', '/settings')).toBe(false)
        expect(isRouteProtectedByMiddleware('/project', '/admin')).toBe(false)
      })
    })

    describe('when matcher is an array', () => {
      it('returns true when route matches any pattern in the array', () => {
        mockFileExists('/project/middleware.ts')
        mockFileContent(`
          export async function middleware(request) {
            const session = await getServerSession(request)
          }
          export const config = {
            matcher: ['/dashboard/:path*', '/admin/:path*', '/settings']
          }
        `)
        expect(isRouteProtectedByMiddleware('/project', '/dashboard/orders')).toBe(true)
        expect(isRouteProtectedByMiddleware('/project', '/admin')).toBe(true)
        expect(isRouteProtectedByMiddleware('/project', '/settings')).toBe(true)
      })

      it('returns false when route matches no pattern in the array', () => {
        mockFileExists('/project/middleware.ts')
        mockFileContent(`
          export async function middleware(request) {
            const session = await getServerSession(request)
          }
          export const config = {
            matcher: ['/dashboard/:path*', '/admin/:path*']
          }
        `)
        expect(isRouteProtectedByMiddleware('/project', '/profile')).toBe(false)
        expect(isRouteProtectedByMiddleware('/project', '/billing')).toBe(false)
      })
    })

    describe('when matcher uses locale dynamic segments', () => {
      it('returns true when route matches a locale-prefixed pattern', () => {
        mockFileExists('/project/middleware.ts')
        mockFileContent(`
          export async function middleware(request) {
            const session = await getServerSession(request)
          }
          export const config = {
            matcher: ['/[locale]/dashboard/:path*']
          }
        `)
        expect(isRouteProtectedByMiddleware('/project', '/en/dashboard')).toBe(true)
        expect(isRouteProtectedByMiddleware('/project', '/es/dashboard/orders')).toBe(true)
      })

      it('returns false when route does not match the locale-prefixed pattern', () => {
        mockFileExists('/project/middleware.ts')
        mockFileContent(`
          export async function middleware(request) {
            const session = await getServerSession(request)
          }
          export const config = {
            matcher: ['/[locale]/dashboard/:path*']
          }
        `)
        expect(isRouteProtectedByMiddleware('/project', '/settings')).toBe(false)
      })
    })

    describe('when matcher uses a regex-style pattern', () => {
      it('returns true when route matches the regex pattern', () => {
        mockFileExists('/project/middleware.ts')
        mockFileContent(`
          export async function middleware(request) {
            const session = await getServerSession(request)
          }
          export const config = {
            matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)']
          }
        `)
        expect(isRouteProtectedByMiddleware('/project', '/dashboard')).toBe(true)
        expect(isRouteProtectedByMiddleware('/project', '/admin')).toBe(true)
      })

      it('returns false when route is excluded by the regex pattern', () => {
        mockFileExists('/project/middleware.ts')
        mockFileContent(`
          export async function middleware(request) {
            const session = await getServerSession(request)
          }
          export const config = {
            matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)']
          }
        `)
        expect(isRouteProtectedByMiddleware('/project', '/api/users')).toBe(false)
      })
    })
  })

  describe('file candidate priority', () => {
    it('prefers src/proxy.ts over proxy.ts', () => {
      vi.mocked(existsSync).mockImplementation(
        (path) => path === '/project/src/proxy.ts' || path === '/project/proxy.ts',
      )
      mockFileContent(`
        export async function proxy(request) {
          const session = await auth(request)
        }
      `)
      isRouteProtectedByMiddleware('/project', '/dashboard')
      expect(vi.mocked(readFileSync)).toHaveBeenCalledWith('/project/src/proxy.ts', 'utf8')
    })

    it('prefers proxy.ts over middleware.ts', () => {
      vi.mocked(existsSync).mockImplementation(
        (path) => path === '/project/proxy.ts' || path === '/project/middleware.ts',
      )
      mockFileContent(`
        export async function proxy(request) {
          const session = await auth(request)
        }
      `)
      isRouteProtectedByMiddleware('/project', '/dashboard')
      expect(vi.mocked(readFileSync)).toHaveBeenCalledWith('/project/proxy.ts', 'utf8')
    })
  })
})
