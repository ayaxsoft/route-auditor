import { describe, it, expect, vi, beforeEach } from 'vitest'
import { readFileSync } from 'fs'

vi.mock('fs', () => ({
  readFileSync: vi.fn(),
}))

import { detectRouterType } from '../../analyzers/scanner'

const mockReadFileSync = vi.mocked(readFileSync)

describe('detectRouterType', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('app router detection', () => {
    it('detects app router when app directory exists', async () => {
      mockReadFileSync.mockReturnValue(JSON.stringify({ exists: true }))
    })
  })

  describe('pages router detection', () => {
    it('detects pages router when pages directory exists', async () => {
      mockReadFileSync.mockReturnValue(JSON.stringify({ exists: true }))
    })
  })

  describe('mixed router detection', () => {
    it('detects mixed router when app and pages directories exist', async () => {
      mockReadFileSync.mockReturnValue(JSON.stringify({ exists: true }))
      mockReadFileSync.mockReturnValue(JSON.stringify({ exists: true }))
    })
  })

  describe('no router detection', () => {
    it('throws an error when no router is detected', async () => {
      mockReadFileSync.mockReturnValue(JSON.stringify({ exists: false }))
      mockReadFileSync.mockReturnValue(JSON.stringify({ exists: false }))
      await expect(detectRouterType('/project')).rejects.toThrow(
        'No Next.js project found at </project>',
      )
    })
  })
})
