import { describe, it, expect, vi } from 'vitest'
import { access } from 'fs/promises'

vi.mock('fs/promises', () => ({
  access: vi.fn(),
}))

import { dirExists } from '../../utils/dir-exists'

const mockAccess = vi.mocked(access)

describe('dirExists', () => {
  it('returns true when the directory exists', async () => {
    mockAccess.mockResolvedValue(undefined)
    expect(await dirExists('/some/path')).toBe(true)
  })

  it('returns false when the directory does not exist', async () => {
    mockAccess.mockRejectedValue(new Error('ENOENT'))
    expect(await dirExists('/nonexistent/path')).toBe(false)
  })
})
