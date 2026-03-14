import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { RouteFile, Vulnerability, AuditRule } from '../../types'

vi.mock('../../analyzers/scanner', () => ({ scanRoutes: vi.fn() }))
vi.mock('../../analyzers/detector', () => ({ detectStack: vi.fn() }))
vi.mock('../../rules', () => ({ ALL_RULES: [] }))

import { runAudit } from '../../analyzers/engine'
import { scanRoutes } from '../../analyzers/scanner'
import { detectStack } from '../../analyzers/detector'
import * as rulesModule from '../../rules'

const mockScanRoutes = vi.mocked(scanRoutes)
const mockDetectStack = vi.mocked(detectStack)

const buildRouteFile = (overrides: Partial<RouteFile> = {}): RouteFile => ({
  projectRoot: '/project',
  filePath: '/project/app/api/users/route.ts',
  routePath: '/api/users',
  routerType: 'app',
  isApiRoute: true,
  isDynamic: false,
  dynamicSegments: [],
  hasCatchAll: false,
  hasOptionalCatchAll: false,
  methods: ['GET'],
  exports: ['GET'],
  rawContent: '',
  ...overrides,
})

const buildVulnerability = (overrides: Partial<Vulnerability> = {}): Vulnerability => ({
  id: 'RW-AUTH-001',
  title: 'Unprotected API Route',
  description: 'Route has no auth',
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
  description: 'No auth',
  severity: 'high',
  category: 'authentication',
  enabled: true,
  check: vi.fn().mockReturnValue([]),
  ...overrides,
})

describe('runAudit', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockDetectStack.mockReturnValue({})
    vi.spyOn(rulesModule, 'ALL_RULES', 'get').mockReturnValue([])
  })

  it('returns result with routes and empty vulnerabilities when no rules flag issues', async () => {
    const routes = [buildRouteFile()]
    mockScanRoutes.mockResolvedValue(routes)

    const result = await runAudit('/project')

    expect(result.routes).toHaveLength(1)
    expect(result.vulnerabilities).toHaveLength(0)
    expect(result.summary.score).toBe(100)
  })

  it('runs enabled rules and collects vulnerabilities', async () => {
    const routes = [buildRouteFile()]
    const vulnerability = buildVulnerability()
    const rule = buildRule({ check: vi.fn().mockReturnValue([vulnerability]) })

    mockScanRoutes.mockResolvedValue(routes)
    vi.spyOn(rulesModule, 'ALL_RULES', 'get').mockReturnValue([rule])

    const result = await runAudit('/project')

    expect(result.vulnerabilities).toHaveLength(1)
    expect(rule.check).toHaveBeenCalledWith(routes[0], expect.objectContaining({ projectRoot: '/project' }))
  })

  it('skips disabled rules', async () => {
    const routes = [buildRouteFile()]
    const rule = buildRule({ enabled: false, check: vi.fn().mockReturnValue([buildVulnerability()]) })

    mockScanRoutes.mockResolvedValue(routes)
    vi.spyOn(rulesModule, 'ALL_RULES', 'get').mockReturnValue([rule])

    const result = await runAudit('/project')

    expect(result.vulnerabilities).toHaveLength(0)
    expect(rule.check).not.toHaveBeenCalled()
  })

  it('skips rules disabled via config', async () => {
    const routes = [buildRouteFile()]
    const rule = buildRule({ check: vi.fn().mockReturnValue([buildVulnerability()]) })

    mockScanRoutes.mockResolvedValue(routes)
    vi.spyOn(rulesModule, 'ALL_RULES', 'get').mockReturnValue([rule])

    const result = await runAudit('/project', { rules: { 'RW-AUTH-001': false } })

    expect(result.vulnerabilities).toHaveLength(0)
  })

  describe('severity filtering', () => {
    it('filters out vulnerabilities below minimum severity', async () => {
      const routes = [buildRouteFile()]
      const lowVuln = buildVulnerability({ severity: 'low' })
      const highVuln = buildVulnerability({ severity: 'high' })
      const rule = buildRule({ check: vi.fn().mockReturnValue([lowVuln, highVuln]) })

      mockScanRoutes.mockResolvedValue(routes)
      vi.spyOn(rulesModule, 'ALL_RULES', 'get').mockReturnValue([rule])

      const result = await runAudit('/project', { severity: 'high' })

      expect(result.vulnerabilities).toHaveLength(1)
      expect(result.vulnerabilities[0]?.severity).toBe('high')
    })

    it('includes all vulnerabilities when severity is info', async () => {
      const routes = [buildRouteFile()]
      const vulns = [
        buildVulnerability({ severity: 'critical' }),
        buildVulnerability({ severity: 'info' }),
      ]
      const rule = buildRule({ check: vi.fn().mockReturnValue(vulns) })

      mockScanRoutes.mockResolvedValue(routes)
      vi.spyOn(rulesModule, 'ALL_RULES', 'get').mockReturnValue([rule])

      const result = await runAudit('/project', { severity: 'info' })

      expect(result.vulnerabilities).toHaveLength(2)
    })
  })

  describe('score computation', () => {
    it('returns score of 100 when there are no vulnerabilities', async () => {
      mockScanRoutes.mockResolvedValue([buildRouteFile()])
      const result = await runAudit('/project')
      expect(result.summary.score).toBe(100)
    })

    it('reduces score based on severity penalties', async () => {
      const routes = [buildRouteFile()]
      const criticalVuln = buildVulnerability({ severity: 'critical' })
      const rule = buildRule({ check: vi.fn().mockReturnValue([criticalVuln]) })

      mockScanRoutes.mockResolvedValue(routes)
      vi.spyOn(rulesModule, 'ALL_RULES', 'get').mockReturnValue([rule])

      const result = await runAudit('/project')

      expect(result.summary.score).toBe(75) // 100 - 25 (critical penalty)
    })

    it('does not go below 0', async () => {
      const routes = [buildRouteFile()]
      const criticalVulns = Array.from({ length: 10 }, () => buildVulnerability({ severity: 'critical' }))
      const rule = buildRule({ check: vi.fn().mockReturnValue(criticalVulns) })

      mockScanRoutes.mockResolvedValue(routes)
      vi.spyOn(rulesModule, 'ALL_RULES', 'get').mockReturnValue([rule])

      const result = await runAudit('/project')

      expect(result.summary.score).toBe(0)
    })
  })

  describe('summary', () => {
    it('counts vulnerabilities by severity', async () => {
      const routes = [buildRouteFile()]
      const vulns = [
        buildVulnerability({ severity: 'critical' }),
        buildVulnerability({ severity: 'high' }),
        buildVulnerability({ severity: 'high' }),
      ]
      const rule = buildRule({ check: vi.fn().mockReturnValue(vulns) })

      mockScanRoutes.mockResolvedValue(routes)
      vi.spyOn(rulesModule, 'ALL_RULES', 'get').mockReturnValue([rule])

      const result = await runAudit('/project')

      expect(result.summary.bySeverity.critical).toBe(1)
      expect(result.summary.bySeverity.high).toBe(2)
      expect(result.summary.bySeverity.medium).toBe(0)
    })

    it('counts vulnerabilities by category', async () => {
      const routes = [buildRouteFile()]
      const vulns = [
        buildVulnerability({ category: 'authentication' }),
        buildVulnerability({ category: 'authentication' }),
        buildVulnerability({ category: 'cors' }),
      ]
      const rule = buildRule({ check: vi.fn().mockReturnValue(vulns) })

      mockScanRoutes.mockResolvedValue(routes)
      vi.spyOn(rulesModule, 'ALL_RULES', 'get').mockReturnValue([rule])

      const result = await runAudit('/project')

      expect(result.summary.byCategory.authentication).toBe(2)
      expect(result.summary.byCategory.cors).toBe(1)
    })

    it('reports total and API route counts', async () => {
      const routes = [
        buildRouteFile({ isApiRoute: true }),
        buildRouteFile({ isApiRoute: false, routePath: '/about' }),
      ]
      mockScanRoutes.mockResolvedValue(routes)

      const result = await runAudit('/project')

      expect(result.summary.totalRoutes).toBe(2)
      expect(result.summary.totalApiRoutes).toBe(1)
    })
  })

  describe('router type detection', () => {
    it('derives app router type when all routes are app router', async () => {
      mockScanRoutes.mockResolvedValue([buildRouteFile({ routerType: 'app' })])
      const result = await runAudit('/project')
      expect(result.routerType).toBe('app')
    })

    it('derives mixed router type when both app and pages routes exist', async () => {
      mockScanRoutes.mockResolvedValue([
        buildRouteFile({ routerType: 'app' }),
        buildRouteFile({ routerType: 'pages' }),
      ])
      const result = await runAudit('/project')
      expect(result.routerType).toBe('mixed')
    })
  })
})
