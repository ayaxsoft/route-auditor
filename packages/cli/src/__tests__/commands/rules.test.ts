import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, writeFileSync, readFileSync, existsSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import { ALL_RULES } from '../../rules'
import { isRuleEnabled, rulesCommand } from '../../commands/rules'
import type { AuditConfig } from '../../types'

vi.mock('@inquirer/prompts', () => ({ checkbox: vi.fn() }))

import { checkbox } from '@inquirer/prompts'

const mockCheckbox = vi.mocked(checkbox)

const CONFIG_FILENAME = 'route-auditor.config.json'

const readConfig = (dir: string): AuditConfig =>
  JSON.parse(readFileSync(join(dir, CONFIG_FILENAME), 'utf-8'))

const buildConfig = (overrides: Partial<AuditConfig> = {}): AuditConfig => ({
  rules: {},
  ...overrides,
})

let tempDir: string

beforeEach(() => {
  tempDir = mkdtempSync(join(tmpdir(), 'route-auditor-rules-test-'))
  vi.clearAllMocks()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('isRuleEnabled', () => {
  it('returns true when no config exists for the rule', () => {
    expect(isRuleEnabled('RW-AUTH-001', buildConfig())).toBe(true)
  })

  it('returns false when rule is explicitly disabled', () => {
    const config = buildConfig({ rules: { 'RW-AUTH-001': false } })
    expect(isRuleEnabled('RW-AUTH-001', config)).toBe(false)
  })

  it('returns true when rule is explicitly enabled', () => {
    const config = buildConfig({ rules: { 'RW-AUTH-001': true } })
    expect(isRuleEnabled('RW-AUTH-001', config)).toBe(true)
  })

  it('returns true when rules object is undefined', () => {
    expect(isRuleEnabled('RW-AUTH-001', {})).toBe(true)
  })
})

describe('disable persistence', () => {
  it('creates config and disables selected rules', async () => {
    mockCheckbox.mockResolvedValue(['RW-AUTH-001', 'RW-RATE-001'])
    await rulesCommand.parseAsync(['node', 'rules', 'disable', tempDir])
    const config = readConfig(tempDir)
    expect(config.rules?.['RW-AUTH-001']).toBe(false)
    expect(config.rules?.['RW-RATE-001']).toBe(false)
  })

  it('preserves existing config fields when disabling', async () => {
    writeFileSync(
      join(tempDir, CONFIG_FILENAME),
      JSON.stringify({ severity: 'high', rules: { 'RW-CORS-001': false } }),
    )
    mockCheckbox.mockResolvedValue(['RW-AUTH-001'])
    await rulesCommand.parseAsync(['node', 'rules', 'disable', tempDir])
    const config = readConfig(tempDir)
    expect(config.severity).toBe('high')
    expect(config.rules?.['RW-CORS-001']).toBe(false)
    expect(config.rules?.['RW-AUTH-001']).toBe(false)
  })

  it('does not create config file when no rules are selected', async () => {
    mockCheckbox.mockResolvedValue([])
    await rulesCommand.parseAsync(['node', 'rules', 'disable', tempDir])
    expect(existsSync(join(tempDir, CONFIG_FILENAME))).toBe(false)
  })
})

describe('enable persistence', () => {
  it('enables selected rules', async () => {
    writeFileSync(
      join(tempDir, CONFIG_FILENAME),
      JSON.stringify({ rules: { 'RW-AUTH-001': false, 'RW-RATE-001': false } }),
    )
    mockCheckbox.mockResolvedValue(['RW-AUTH-001'])
    await rulesCommand.parseAsync(['node', 'rules', 'enable', tempDir])
    const config = readConfig(tempDir)
    expect(config.rules?.['RW-AUTH-001']).toBe(true)
    expect(config.rules?.['RW-RATE-001']).toBe(false)
  })

  it('does not modify config when no rules are selected', async () => {
    writeFileSync(
      join(tempDir, CONFIG_FILENAME),
      JSON.stringify({ rules: { 'RW-AUTH-001': false } }),
    )
    mockCheckbox.mockResolvedValue([])
    await rulesCommand.parseAsync(['node', 'rules', 'enable', tempDir])
    const config = readConfig(tempDir)
    expect(config.rules?.['RW-AUTH-001']).toBe(false)
  })
})

describe('ALL_RULES', () => {
  it('has 12 rules registered', () => {
    expect(ALL_RULES).toHaveLength(12)
  })

  it('all rules have unique ids', () => {
    const ids = ALL_RULES.map((innerRule) => innerRule.id)
    expect(new Set(ids).size).toBe(ALL_RULES.length)
  })

  it('all rules are enabled by default', () => {
    for (const innerRule of ALL_RULES) {
      expect(innerRule.enabled).toBe(true)
    }
  })
})
