import type {
  AuditResult,
  AuditConfig,
  AuditContext,
  AuditSummary,
  Severity,
  RouterType,
  Vulnerability,
  RouteFile,
} from '../types'
import { scanRoutes } from './scanner'
import { detectStack } from './detector'
import { ALL_RULES } from '../rules'
import { SEVERITY_ORDER, SEVERITY_PENALTY } from '@route-auditor/shared'

const deriveRouterType = (routerTypes: Set<RouterType>): RouterType => {
  if (routerTypes.has('app') && routerTypes.has('pages')) return 'mixed'
  if (routerTypes.has('app')) return 'app'
  return 'pages'
}

const computeScore = (vulnerabilities: Vulnerability[]): number => {
  const totalPenalty = vulnerabilities.reduce(
    (accumulated, vulnerability) => accumulated + SEVERITY_PENALTY[vulnerability.severity],
    0,
  )
  return Math.max(0, 100 - totalPenalty)
}

const buildSummary = (routes: RouteFile[], vulnerabilities: Vulnerability[]): AuditSummary => {
  const bySeverity: Record<Severity, number> = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    info: 0,
  }

  const byCategory: AuditSummary['byCategory'] = {}

  for (const vulnerability of vulnerabilities) {
    bySeverity[vulnerability.severity]++
    byCategory[vulnerability.category] = (byCategory[vulnerability.category] ?? 0) + 1
  }

  return {
    totalRoutes: routes.length,
    totalApiRoutes: routes.filter((innerRoute) => innerRoute.isApiRoute).length,
    totalVulnerabilities: vulnerabilities.length,
    bySeverity,
    byCategory,
    score: computeScore(vulnerabilities),
  }
}

const isRuleEnabled = (ruleId: string, config: AuditConfig): boolean => {
  const ruleConfig = config.rules?.[ruleId]
  if (ruleConfig === false) return false
  return true
}

const isIgnored = (routePath: string, ignorePatterns: string[]): boolean =>
  ignorePatterns.some((innerPattern) => {
    if (innerPattern.endsWith('/**')) {
      const prefix = innerPattern.slice(0, -3)
      return routePath === prefix || routePath.startsWith(prefix + '/')
    }
    if (innerPattern.endsWith('/*')) {
      const prefix = innerPattern.slice(0, -2)
      const remainder = routePath.slice(prefix.length + 1)
      return routePath.startsWith(prefix + '/') && !remainder.includes('/')
    }
    return routePath === innerPattern
  })

const meetsMinimumSeverity = (severity: Severity, minimumSeverity: Severity): boolean => {
  return SEVERITY_ORDER.indexOf(severity) <= SEVERITY_ORDER.indexOf(minimumSeverity)
}

export const runAudit = async (
  projectRoot: string,
  config: AuditConfig = {},
): Promise<AuditResult> => {
  const startTime = Date.now()

  const routes = await scanRoutes(projectRoot)
  const detectedStack = detectStack(projectRoot)

  const routerTypes = new Set(routes.map((innerRoute) => innerRoute.routerType))
  const routerType = deriveRouterType(routerTypes)

  const minimumSeverity = config.severity ?? 'info'

  const context: AuditContext = {
    projectRoot,
    routerType,
    detectedStack,
    config,
    allRoutes: routes,
  }

  const ignorePatterns = config.ignore ?? []

  const auditableRoutes =
    ignorePatterns.length > 0
      ? routes.filter((innerRoute) => !isIgnored(innerRoute.routePath, ignorePatterns))
      : routes

  const enabledRules = ALL_RULES.filter(
    (innerRule) => innerRule.enabled && isRuleEnabled(innerRule.id, config),
  )

  const allVulnerabilities = auditableRoutes.flatMap((innerRoute) =>
    enabledRules.flatMap((innerRule) => innerRule.check(innerRoute, context)),
  )

  const filteredVulnerabilities = allVulnerabilities.filter((innerVulnerability) =>
    meetsMinimumSeverity(innerVulnerability.severity, minimumSeverity),
  )

  return {
    projectRoot,
    routerType,
    detectedStack,
    scannedAt: new Date().toISOString(),
    routes,
    vulnerabilities: filteredVulnerabilities,
    summary: buildSummary(routes, filteredVulnerabilities),
    duration: Date.now() - startTime,
  }
}
