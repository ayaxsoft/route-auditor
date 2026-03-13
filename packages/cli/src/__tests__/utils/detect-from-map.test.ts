import { describe, it, expect } from 'vitest'
import { detect } from '../../utils/detect-from-map'

describe('detect', () => {
  const map = { 'next-auth': 'next-auth', '@clerk/nextjs': 'clerk' } as const

  it('returns the mapped value when a dep matches', () => {
    const deps = new Set(['next-auth'])
    expect(detect(deps, map)).toBe('next-auth')
  })

  it('returns the mapped value for a scoped package', () => {
    const deps = new Set(['@clerk/nextjs'])
    expect(detect(deps, map)).toBe('clerk')
  })

  it('returns undefined when no dep matches', () => {
    const deps = new Set(['some-unknown-lib'])
    expect(detect(deps, map)).toBeUndefined()
  })

  it('returns undefined for an empty set', () => {
    expect(detect(new Set(), map)).toBeUndefined()
  })
})
