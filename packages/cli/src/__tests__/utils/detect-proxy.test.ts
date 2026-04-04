import { describe, it, expect, vi, beforeEach } from 'vitest'
import { isRouteProtectedByLayout } from '../../utils/detect-proxy'

vi.mock('fs', () => ({
  existsSync: vi.fn(),
  readFileSync: vi.fn(),
}))

import { existsSync, readFileSync } from 'fs'

const withLayoutAt = (layoutPath: string, content: string) => {
  vi.mocked(existsSync).mockImplementation((filePath) => filePath === layoutPath)
  vi.mocked(readFileSync).mockImplementation((filePath) => {
    if (filePath === layoutPath) return content
    throw new Error('File not found')
  })
}

beforeEach(() => {
  vi.resetAllMocks()
})

describe('isRouteProtectedByLayout', () => {
  describe('when no layout file exists in any ancestor directory', () => {
    it('returns false', () => {
      vi.mocked(existsSync).mockReturnValue(false)
      const result = isRouteProtectedByLayout('/project/app/dashboard/page.tsx', '/project')
      expect(result).toBe(false)
    })
  })

  describe('when a layout exists in the same directory but has no auth logic', () => {
    it('returns false', () => {
      withLayoutAt(
        '/project/app/dashboard/layout.tsx',
        `export default function Layout({ children }) { return <div>{children}</div> }`,
      )
      const result = isRouteProtectedByLayout('/project/app/dashboard/page.tsx', '/project')
      expect(result).toBe(false)
    })
  })

  describe('when a layout in the same directory has auth logic', () => {
    it('returns true when layout uses getServerSession', () => {
      withLayoutAt(
        '/project/app/dashboard/layout.tsx',
        `
        import { getServerSession } from 'next-auth'
        import { redirect } from 'next/navigation'
        export default async function Layout({ children }) {
          const session = await getServerSession()
          if (!session) redirect('/login')
          return <>{children}</>
        }
        `,
      )
      const result = isRouteProtectedByLayout('/project/app/dashboard/page.tsx', '/project')
      expect(result).toBe(true)
    })

    it('returns true when layout uses clerk auth(', () => {
      const clerkAuthSignature = 'auth('
      withLayoutAt(
        '/project/app/dashboard/layout.tsx',
        `
        import { ${clerkAuthSignature} } from '@clerk/nextjs/server'
        export default async function Layout({ children }) {
          const { userId } = await ${clerkAuthSignature})
          if (!userId) redirect('/sign-in')
          return <>{children}</>
        }
        `,
      )
      const result = isRouteProtectedByLayout('/project/app/dashboard/page.tsx', '/project')
      expect(result).toBe(true)
    })

    it('returns true when layout uses better-auth auth.api', () => {
      withLayoutAt(
        '/project/app/dashboard/layout.tsx',
        `
        import { auth } from '@/lib/auth'
        export default async function Layout({ children }) {
          const session = await auth.api.getSession({ headers: await headers() })
          if (!session) redirect('/login')
          return <>{children}</>
        }
        `,
      )
      const result = isRouteProtectedByLayout('/project/app/dashboard/page.tsx', '/project')
      expect(result).toBe(true)
    })

    it('returns true when layout uses supabase.auth', () => {
      withLayoutAt(
        '/project/app/dashboard/layout.tsx',
        `
        export default async function Layout({ children }) {
          const supabase = createClient()
          const { data: { user } } = await supabase.auth.getUser()
          if (!user) redirect('/login')
          return <>{children}</>
        }
        `,
      )
      const result = isRouteProtectedByLayout('/project/app/dashboard/page.tsx', '/project')
      expect(result).toBe(true)
    })
  })

  describe('when a layout exists in an ancestor directory with auth logic', () => {
    it('returns true when the immediate parent directory has an auth layout', () => {
      withLayoutAt(
        '/project/app/dashboard/layout.tsx',
        `
        export default async function Layout({ children }) {
          const session = await getServerSession()
          if (!session) redirect('/login')
          return <>{children}</>
        }
        `,
      )
      const result = isRouteProtectedByLayout(
        '/project/app/dashboard/settings/page.tsx',
        '/project',
      )
      expect(result).toBe(true)
    })

    it('returns true when a grandparent directory has an auth layout', () => {
      vi.mocked(existsSync).mockImplementation((filePath) => filePath === '/project/app/layout.tsx')
      vi.mocked(readFileSync).mockImplementation((filePath) => {
        if (filePath === '/project/app/layout.tsx') {
          return `
          export default async function RootLayout({ children }) {
            const session = await getServerSession()
            if (!session) redirect('/login')
            return <html><body>{children}</body></html>
          }
          `
        }
        throw new Error('File not found')
      })

      const result = isRouteProtectedByLayout(
        '/project/app/dashboard/settings/page.tsx',
        '/project',
      )
      expect(result).toBe(true)
    })
  })

  describe('when the route is inside a route group', () => {
    it('returns true when the route group layout has auth logic', () => {
      withLayoutAt(
        '/project/app/(protected)/layout.tsx',
        `
        export default async function ProtectedLayout({ children }) {
          const session = await getServerSession()
          if (!session) redirect('/login')
          return <>{children}</>
        }
        `,
      )
      const result = isRouteProtectedByLayout(
        '/project/app/(protected)/dashboard/page.tsx',
        '/project',
      )
      expect(result).toBe(true)
    })
  })

  describe('when traversal reaches projectRoot', () => {
    it('does not check layout files above projectRoot', () => {
      vi.mocked(existsSync).mockReturnValue(false)
      isRouteProtectedByLayout('/project/app/dashboard/page.tsx', '/project')
      const checkedPaths = vi.mocked(existsSync).mock.calls.map(([filePath]) => filePath as string)
      expect(checkedPaths.every((filePath) => filePath.startsWith('/project'))).toBe(true)
      expect(checkedPaths.some((filePath) => filePath.startsWith('/layout'))).toBe(false)
    })
  })

  describe('layout file extension priority', () => {
    it('detects layout.tsx', () => {
      withLayoutAt(
        '/project/app/dashboard/layout.tsx',
        `export default async function Layout({ children }) {
          const session = await getServerSession()
          return <>{children}</>
        }`,
      )
      expect(isRouteProtectedByLayout('/project/app/dashboard/page.tsx', '/project')).toBe(true)
    })

    it('detects layout.js', () => {
      withLayoutAt(
        '/project/app/dashboard/layout.js',
        `export default async function Layout({ children }) {
          const session = await getServerSession()
          return children
        }`,
      )
      expect(isRouteProtectedByLayout('/project/app/dashboard/page.tsx', '/project')).toBe(true)
    })
  })
})
