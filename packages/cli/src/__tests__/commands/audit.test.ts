import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, writeFileSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'

vi.mock('../../analyzers/engine', () => ({ runAudit: vi.fn() }))
vi.mock('../../reporters/console', () => ({
  renderHeader: vi.fn(),
  renderConsoleReport: vi.fn(),
}))

import { auditCommand } from '../../commands/audit'
import { runAudit } from '../../analyzers/engine'
import type { AuditResult } from '../../types'

const mockRunAudit = vi.mocked(runAudit)

const buildAuditResult = (overrides: Partial<AuditResult> = {}): AuditResult => ({
  projectRoot: '/project',
  routerType: 'app',
  detectedStack: {},
  scannedAt: new Date().toISOString(),
  routes: [],
  vulnerabilities: [],
  summary: {
    totalRoutes: 0,
    totalApiRoutes: 0,
    totalVulnerabilities: 0,
    bySeverity: { critical: 0, high: 0, medium: 0, low: 0, info: 0 },
    byCategory: {},
    score: 100,
  },
  duration: 10,
  ...overrides,
})

let originalCwd: string
let projectDir: string
let cwdDir: string

beforeEach(() => {
  originalCwd = process.cwd()
  projectDir = mkdtempSync(join(tmpdir(), 'route-auditor-project-'))
  cwdDir = mkdtempSync(join(tmpdir(), 'route-auditor-cwd-'))
  vi.clearAllMocks()
  mockRunAudit.mockResolvedValue(buildAuditResult())
})

afterEach(() => {
  process.chdir(originalCwd)
  vi.restoreAllMocks()
})

describe('audit config resolution', () => {
  it('loads config from cwd when not found in projectRoot', async () => {
    writeFileSync(
      join(cwdDir, 'route-auditor.config.json'),
      JSON.stringify({ rules: { 'RW-AUTH-001': false } }),
    )
    process.chdir(cwdDir)

    await auditCommand.parseAsync(['node', 'audit', projectDir])

    expect(mockRunAudit).toHaveBeenCalledWith(
      projectDir,
      expect.objectContaining({ rules: { 'RW-AUTH-001': false } }),
    )
  })

  it('prefers projectRoot config over cwd config', async () => {
    writeFileSync(
      join(projectDir, 'route-auditor.config.json'),
      JSON.stringify({ rules: { 'RW-CORS-001': false } }),
    )
    writeFileSync(
      join(cwdDir, 'route-auditor.config.json'),
      JSON.stringify({ rules: { 'RW-AUTH-001': false } }),
    )
    process.chdir(cwdDir)

    await auditCommand.parseAsync(['node', 'audit', projectDir])

    expect(mockRunAudit).toHaveBeenCalledWith(
      projectDir,
      expect.objectContaining({ rules: { 'RW-CORS-001': false } }),
    )
  })

  it('uses empty config when no config file is found anywhere', async () => {
    process.chdir(cwdDir)

    await auditCommand.parseAsync(['node', 'audit', projectDir])

    expect(mockRunAudit).toHaveBeenCalledWith(
      projectDir,
      expect.not.objectContaining({ rules: { 'RW-AUTH-001': false } }),
    )
  })
})
