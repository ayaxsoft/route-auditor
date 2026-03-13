import { describe, it, expect } from 'vitest'
import { filePathToRoutePath } from '../../utils/file-path-to-route-path'

describe('filePathToRoutePath', () => {
  describe('app router — route groups', () => {
    it('removes a single route group from the path', () => {
      expect(filePathToRoutePath('(auth)/login/page.tsx', 'app')).toBe('/login')
    })

    it('removes multiple route groups from the path', () => {
      expect(filePathToRoutePath('(dashboard)/[orgSlug]/(finance)/billing/page.tsx', 'app')).toBe(
        '/[orgSlug]/billing',
      )
    })

    it('returns / when only a route group remains', () => {
      expect(filePathToRoutePath('(dashboard)/page.tsx', 'app')).toBe('/')
    })
  })

  describe('app router', () => {
    it('converts a nested page to its route path', () => {
      expect(filePathToRoutePath('dashboard/settings/page.tsx', 'app')).toBe('/dashboard/settings')
    })

    it('converts a root page to /', () => {
      expect(filePathToRoutePath('page.tsx', 'app')).toBe('/')
    })

    it('converts a route file to its api path', () => {
      expect(filePathToRoutePath('api/users/route.ts', 'app')).toBe('/api/users')
    })

    it('converts a dynamic route file', () => {
      expect(filePathToRoutePath('api/users/[id]/route.ts', 'app')).toBe('/api/users/[id]')
    })

    it('converts a dynamic page file', () => {
      expect(filePathToRoutePath('blog/[slug]/page.tsx', 'app')).toBe('/blog/[slug]')
    })
  })

  describe('pages router', () => {
    it('converts a nested page to its route path', () => {
      expect(filePathToRoutePath('users/profile.tsx', 'pages')).toBe('/users/profile')
    })

    it('converts index at root to /', () => {
      expect(filePathToRoutePath('index.tsx', 'pages')).toBe('/')
    })

    it('converts nested index to parent path', () => {
      expect(filePathToRoutePath('about/index.tsx', 'pages')).toBe('/about')
    })

    it('converts a dynamic page', () => {
      expect(filePathToRoutePath('users/[id].tsx', 'pages')).toBe('/users/[id]')
    })

    it('converts an api route', () => {
      expect(filePathToRoutePath('api/auth.ts', 'pages')).toBe('/api/auth')
    })
  })
})
