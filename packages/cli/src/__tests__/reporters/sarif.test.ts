import { describe, it, expect } from 'vitest'
import { renderSarifReport } from '../../reporters/sarif'
import type { AuditResult, AuditRule, Vulnerability } from '../../types'

const buildVulnerability = (overrides: Partial<Vulnerability> = {}): Vulnerability => ({
  id: 'RW-AUTH-001',
  title: 'Unprotected API Route',
  description: 'Route has no authentication checks.',
  severity: 'high',
  category: 'authentication',
  filePath: '/project/app/api/users/route.ts',
  routePath: '/api/users',
  fix: { description: 'Add auth', effort: 'low' },
  ...overrides,
})

const buildRule = (overrides: Partial<AuditRule> = {}): AuditRule => ({
  id: 'RW-AUTH-001',
  name: 'Unprotected API Route',
  description: 'API route does not appear to have authentication checks.',
  severity: 'high',
  category: 'authentication',
  enabled: true,
  check: () => [],
  ...overrides,
})

const buildResult = (overrides: Partial<AuditResult> = {}): AuditResult => ({
  projectRoot: '/project',
  routerType: 'app',
  detectedStack: {},
  scannedAt: '2026-01-01T00:00:00.000Z',
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

const parseReport = (output: string) => JSON.parse(output)

describe('renderSarifReport', () => {
  describe('SARIF structure', () => {
    it('outputs valid JSON', () => {
      const output = renderSarifReport(buildResult(), [])
      expect(() => JSON.parse(output)).not.toThrow()
    })

    it('includes the SARIF 2.1.0 schema', () => {
      const report = parseReport(renderSarifReport(buildResult(), []))
      expect(report.$schema).toContain('sarif-schema-2.1.0.json')
    })

    it('sets version to 2.1.0', () => {
      const report = parseReport(renderSarifReport(buildResult(), []))
      expect(report.version).toBe('2.1.0')
    })

    it('includes tool driver with name route-auditor', () => {
      const report = parseReport(renderSarifReport(buildResult(), []))
      expect(report.runs[0].tool.driver.name).toBe('route-auditor')
    })
  })

  describe('rules mapping', () => {
    it('maps rules to SARIF rule format', () => {
      const rule = buildRule()
      const report = parseReport(renderSarifReport(buildResult(), [rule]))
      const sarifRule = report.runs[0].tool.driver.rules[0]

      expect(sarifRule.id).toBe('RW-AUTH-001')
      expect(sarifRule.name).toBe('Unprotected API Route')
      expect(sarifRule.shortDescription.text).toBe(
        'API route does not appear to have authentication checks.',
      )
      expect(sarifRule.properties.tags).toContain('authentication')
    })

    it('includes empty rules array when no rules provided', () => {
      const report = parseReport(renderSarifReport(buildResult(), []))
      expect(report.runs[0].tool.driver.rules).toHaveLength(0)
    })
  })

  describe('results mapping', () => {
    it('produces empty results when there are no vulnerabilities', () => {
      const report = parseReport(renderSarifReport(buildResult(), []))
      expect(report.runs[0].results).toHaveLength(0)
    })

    it('maps each vulnerability to a SARIF result', () => {
      const vulnerability = buildVulnerability()
      const result = buildResult({ vulnerabilities: [vulnerability] })
      const report = parseReport(renderSarifReport(result, []))
      const sarifResult = report.runs[0].results[0]

      expect(sarifResult.ruleId).toBe('RW-AUTH-001')
      expect(sarifResult.message.text).toBe('Route has no authentication checks.')
      expect(sarifResult.locations[0].physicalLocation.artifactLocation.uri).toBe(
        '/project/app/api/users/route.ts',
      )
      expect(sarifResult.locations[0].physicalLocation.artifactLocation.uriBaseId).toBe('%SRCROOT%')
    })
  })

  describe('severity to SARIF level mapping', () => {
    it.each([
      ['critical', 'error'],
      ['high', 'error'],
      ['medium', 'warning'],
      ['low', 'note'],
      ['info', 'none'],
    ] as const)('maps %s severity to %s level', (severity, expectedLevel) => {
      const vulnerability = buildVulnerability({ severity })
      const result = buildResult({ vulnerabilities: [vulnerability] })
      const report = parseReport(renderSarifReport(result, []))

      expect(report.runs[0].results[0].level).toBe(expectedLevel)
    })
  })
})
