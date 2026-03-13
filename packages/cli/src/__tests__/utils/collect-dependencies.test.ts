import { describe, it, expect } from 'vitest'
import { collectDependencies } from '../../utils/collect-dependencies'

describe('collectDependencies', () => {
  it('collects from dependencies', () => {
    const result = collectDependencies({ dependencies: { react: '^18.0.0' } })
    expect(result.has('react')).toBe(true)
  })

  it('collects from devDependencies', () => {
    const result = collectDependencies({ devDependencies: { vitest: '^1.0.0' } })
    expect(result.has('vitest')).toBe(true)
  })

  it('collects from peerDependencies', () => {
    const result = collectDependencies({ peerDependencies: { typescript: '^5.0.0' } })
    expect(result.has('typescript')).toBe(true)
  })

  it('collects from all sections combined', () => {
    const result = collectDependencies({
      dependencies: { react: '^18.0.0' },
      devDependencies: { vitest: '^1.0.0' },
      peerDependencies: { typescript: '^5.0.0' },
    })
    expect(result.has('react')).toBe(true)
    expect(result.has('vitest')).toBe(true)
    expect(result.has('typescript')).toBe(true)
  })

  it('returns empty set when no sections exist', () => {
    const result = collectDependencies({})
    expect(result.size).toBe(0)
  })

  it('ignores unknown sections', () => {
    const result = collectDependencies({ scripts: { build: 'tsc' } })
    expect(result.size).toBe(0)
  })
})
