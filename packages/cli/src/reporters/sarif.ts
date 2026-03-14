import type { AuditResult, AuditRule, Vulnerability } from '../types'

declare const __PACKAGE_VERSION__: string
const version = __PACKAGE_VERSION__

interface SarifLocation {
  physicalLocation: {
    artifactLocation: { uri: string; uriBaseId: string }
  }
}

interface SarifResult {
  ruleId: string
  level: 'error' | 'warning' | 'note' | 'none'
  message: { text: string }
  locations: SarifLocation[]
}

interface SarifRule {
  id: string
  name: string
  shortDescription: { text: string }
  helpUri?: string
  properties: { tags: string[] }
}

interface SarifReport {
  $schema: string
  version: string
  runs: Array<{
    tool: { driver: { name: string; version: string; informationUri: string; rules: SarifRule[] } }
    results: SarifResult[]
  }>
}

const SEVERITY_TO_LEVEL: Record<string, SarifResult['level']> = {
  critical: 'error',
  high: 'error',
  medium: 'warning',
  low: 'note',
  info: 'none',
}

const vulnerabilityToSarifResult = (vulnerability: Vulnerability): SarifResult => ({
  ruleId: vulnerability.id,
  level: SEVERITY_TO_LEVEL[vulnerability.severity] ?? 'warning',
  message: { text: vulnerability.description },
  locations: [
    {
      physicalLocation: {
        artifactLocation: {
          uri: vulnerability.filePath,
          uriBaseId: '%SRCROOT%',
        },
      },
    },
  ],
})

const ruleToSarifRule = (rule: AuditRule): SarifRule => ({
  id: rule.id,
  name: rule.name,
  shortDescription: { text: rule.description },
  properties: { tags: [rule.category] },
})

export const renderSarifReport = (result: AuditResult, rules: AuditRule[]): string => {
  const report: SarifReport = {
    $schema:
      'https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json',
    version: '2.1.0',
    runs: [
      {
        tool: {
          driver: {
            name: 'route-auditor',
            version,
            informationUri: 'https://github.com/drbarzaga/route-auditor',
            rules: rules.map(ruleToSarifRule),
          },
        },
        results: result.vulnerabilities.map(vulnerabilityToSarifResult),
      },
    ],
  }

  return JSON.stringify(report, null, 2)
}
