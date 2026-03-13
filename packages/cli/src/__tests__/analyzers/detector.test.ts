import { describe, it, expect, vi, beforeEach } from 'vitest'
import { readFileSync } from 'fs'

vi.mock('fs', () => ({
  readFileSync: vi.fn(),
}))

import { detectStack } from '../../analyzers/detector'

const mockReadFileSync = vi.mocked(readFileSync)

function pkgJson(sections: Record<string, Record<string, string>>) {
  return JSON.stringify(sections)
}

describe('detectStack', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('auth detection', () => {
    it('detects next-auth from dependencies', () => {
      mockReadFileSync.mockReturnValue(pkgJson({ dependencies: { 'next-auth': '^4.0.0' } }))
      expect(detectStack('/project').auth).toBe('next-auth')
    })

    it('detects clerk via @clerk/nextjs', () => {
      mockReadFileSync.mockReturnValue(pkgJson({ dependencies: { '@clerk/nextjs': '^5.0.0' } }))
      expect(detectStack('/project').auth).toBe('clerk')
    })

    it('detects clerk from devDependencies', () => {
      mockReadFileSync.mockReturnValue(pkgJson({ devDependencies: { '@clerk/nextjs': '^5.0.0' } }))
      expect(detectStack('/project').auth).toBe('clerk')
    })

    it('detects better-auth', () => {
      mockReadFileSync.mockReturnValue(pkgJson({ dependencies: { 'better-auth': '^1.0.0' } }))
      expect(detectStack('/project').auth).toBe('better-auth')
    })
  })

  describe('orm detection', () => {
    it('detects prisma', () => {
      mockReadFileSync.mockReturnValue(pkgJson({ dependencies: { '@prisma/client': '^5.0.0' } }))
      expect(detectStack('/project').orm).toBe('prisma')
    })

    it('maps pg to raw', () => {
      mockReadFileSync.mockReturnValue(pkgJson({ dependencies: { pg: '^8.0.0' } }))
      expect(detectStack('/project').orm).toBe('raw')
    })

    it('maps mysql2 to raw', () => {
      mockReadFileSync.mockReturnValue(pkgJson({ dependencies: { mysql2: '^3.0.0' } }))
      expect(detectStack('/project').orm).toBe('raw')
    })

    it('maps better-sqlite3 to raw', () => {
      mockReadFileSync.mockReturnValue(pkgJson({ dependencies: { 'better-sqlite3': '^9.0.0' } }))
      expect(detectStack('/project').orm).toBe('raw')
    })
  })

  describe('validation detection', () => {
    it('detects zod', () => {
      mockReadFileSync.mockReturnValue(pkgJson({ dependencies: { zod: '^3.0.0' } }))
      expect(detectStack('/project').validation).toBe('zod')
    })

    it('detects valibot', () => {
      mockReadFileSync.mockReturnValue(pkgJson({ dependencies: { valibot: '^0.30.0' } }))
      expect(detectStack('/project').validation).toBe('valibot')
    })
  })

  describe('rate limit detection', () => {
    it('detects upstash rate limiter', () => {
      mockReadFileSync.mockReturnValue(
        pkgJson({ dependencies: { '@upstash/ratelimit': '^1.0.0' } }),
      )
      expect(detectStack('/project').rateLimit).toBe('upstash')
    })
  })

  describe('combined detection', () => {
    it('detects multiple stack items together', () => {
      mockReadFileSync.mockReturnValue(
        pkgJson({
          dependencies: {
            '@prisma/client': '^5.0.0',
            zod: '^3.0.0',
            'next-auth': '^4.0.0',
          },
        }),
      )
      const result = detectStack('/project')
      expect(result.orm).toBe('prisma')
      expect(result.validation).toBe('zod')
      expect(result.auth).toBe('next-auth')
    })
  })

  describe('edge cases', () => {
    it('returns empty object when package.json is missing', () => {
      mockReadFileSync.mockImplementation(() => {
        throw new Error('ENOENT')
      })
      expect(detectStack('/project')).toEqual({})
    })

    it('returns undefined fields for unknown dependencies', () => {
      mockReadFileSync.mockReturnValue(pkgJson({ dependencies: { 'some-unknown-lib': '1.0.0' } }))
      const result = detectStack('/project')
      expect(result.auth).toBeUndefined()
      expect(result.orm).toBeUndefined()
      expect(result.validation).toBeUndefined()
      expect(result.email).toBeUndefined()
      expect(result.rateLimit).toBeUndefined()
    })
  })
})
