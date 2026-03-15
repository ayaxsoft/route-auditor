import { describe, it, expect, vi, beforeEach } from 'vitest'
import { access } from 'fs/promises'

vi.mock('fs/promises', () => ({
  access: vi.fn(),
}))

import { isNextjsProject } from '../../utils/is-nextjs-project'

const mockAccess = vi.mocked(access)

describe('isNextjsProject', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns true when next.config.js exists', async () => {
    mockAccess.mockResolvedValue(undefined)
    expect(await isNextjsProject('/project')).toBe(true)
  })

  it('returns false when no next.config file exists', async () => {
    mockAccess.mockRejectedValue(new Error('ENOENT'))
    expect(await isNextjsProject('/project')).toBe(false)
  })
})
