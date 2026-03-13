import { describe, it, expect } from 'vitest'
import { extractDynamicSegments } from '../../utils/extract-dynamic-segments'

describe('extractDynamicSegments', () => {
  it('returns no segments for a static route', () => {
    const result = extractDynamicSegments('/dashboard/settings')
    expect(result.isDynamic).toBe(false)
    expect(result.dynamicSegments).toEqual([])
    expect(result.hasCatchAll).toBe(false)
    expect(result.hasOptionalCatchAll).toBe(false)
  })

  it('extracts a single dynamic segment', () => {
    const result = extractDynamicSegments('/users/[id]')
    expect(result.isDynamic).toBe(true)
    expect(result.dynamicSegments).toEqual(['id'])
    expect(result.hasCatchAll).toBe(false)
  })

  it('extracts multiple dynamic segments', () => {
    const result = extractDynamicSegments('/users/[id]/posts/[postId]')
    expect(result.dynamicSegments).toEqual(['id', 'postId'])
  })

  it('detects catch-all segment', () => {
    const result = extractDynamicSegments('/docs/[...slug]')
    expect(result.hasCatchAll).toBe(true)
    expect(result.dynamicSegments).toEqual(['slug'])
  })

  it('detects optional catch-all segment', () => {
    const result = extractDynamicSegments('/docs/[[...slug]]')
    expect(result.hasOptionalCatchAll).toBe(true)
    expect(result.dynamicSegments).toEqual(['slug'])
  })
})
