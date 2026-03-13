import { describe, it, expect, vi } from 'vitest'
import { readFileSync } from 'fs'

vi.mock('fs', () => ({
  readFileSync: vi.fn(),
}))

import { readPackageJson } from '../../utils/read-package-json'

const mockReadFileSync = vi.mocked(readFileSync)

describe('readPackageJson', () => {
  it('returns parsed package.json content', () => {
    mockReadFileSync.mockReturnValue(JSON.stringify({ name: 'my-app', version: '1.0.0' }))
    const result = readPackageJson('/project')
    expect(result).toEqual({ name: 'my-app', version: '1.0.0' })
  })

  it('returns empty object when file does not exist', () => {
    mockReadFileSync.mockImplementation(() => {
      throw new Error('ENOENT')
    })
    expect(readPackageJson('/nonexistent')).toEqual({})
  })

  it('returns empty object when file content is invalid json', () => {
    mockReadFileSync.mockReturnValue('not valid json')
    expect(readPackageJson('/project')).toEqual({})
  })
})
