import { describe, it, expect } from 'vitest'
import { extractHttpMethods } from '../../utils/extract-http-methods'

describe('extractHttpMethods', () => {
  it('extracts GET method', () => {
    expect(extractHttpMethods(['GET'])).toEqual(['GET'])
  })

  it('extracts multiple methods', () => {
    expect(extractHttpMethods(['GET', 'POST', 'DELETE'])).toEqual(['GET', 'POST', 'DELETE'])
  })

  it('ignores non-http exports', () => {
    expect(extractHttpMethods(['GET', 'default', 'config', 'POST'])).toEqual(['GET', 'POST'])
  })

  it('returns empty array when no http methods present', () => {
    expect(extractHttpMethods(['default', 'metadata', 'config'])).toEqual([])
  })

  it('returns empty array for empty input', () => {
    expect(extractHttpMethods([])).toEqual([])
  })
})
