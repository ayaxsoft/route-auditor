import { describe, it, expect } from 'vitest'
import { pathTraversal } from '../../rules/path-traversal'
import type { RouteFile, AuditContext } from '../../types'

const buildRouteFile = (overrides: Partial<RouteFile> = {}): RouteFile => ({
  projectRoot: '/project',
  filePath: '/project/app/api/files/[name]/route.ts',
  routePath: '/api/files/[name]',
  routerType: 'app',
  isApiRoute: true,
  isDynamic: true,
  dynamicSegments: ['name'],
  hasCatchAll: false,
  hasOptionalCatchAll: false,
  methods: ['GET'],
  exports: ['GET'],
  rawContent: 'const content = readFileSync(params.name)',
  ...overrides,
})

const buildContext = (overrides: Partial<AuditContext> = {}): AuditContext => ({
  projectRoot: '/project',
  routerType: 'app',
  detectedStack: {},
  config: {},
  allRoutes: [],
  ...overrides,
})

describe('pathTraversal', () => {
  describe('when route is not an API route', () => {
    it('returns no vulnerabilities', () => {
      const route = buildRouteFile({ isApiRoute: false })
      expect(pathTraversal.check(route, buildContext())).toHaveLength(0)
    })
  })

  describe('when route does not use filesystem', () => {
    it('returns no vulnerabilities', () => {
      const route = buildRouteFile({
        rawContent: 'export async function GET() { return Response.json({}) }',
      })
      expect(pathTraversal.check(route, buildContext())).toHaveLength(0)
    })
  })

  describe('when route uses filesystem without user input', () => {
    it('returns no vulnerabilities for static file reads', () => {
      const route = buildRouteFile({
        isDynamic: false,
        dynamicSegments: [],
        rawContent: "const content = readFileSync('./config.json')",
      })
      expect(pathTraversal.check(route, buildContext())).toHaveLength(0)
    })
  })

  describe('when route uses filesystem with user input and no sanitization', () => {
    it('returns a vulnerability for dynamic route with readFileSync', () => {
      const result = pathTraversal.check(buildRouteFile(), buildContext())
      expect(result).toHaveLength(1)
      expect(result[0]?.id).toBe('RW-PATH-001')
      expect(result[0]?.severity).toBe('high')
    })

    it.each([
      ['readFile(', 'readFile(req.query.file, "utf-8", callback)'],
      ['readFileSync(', 'readFileSync(params.name)'],
      ['writeFile(', 'writeFile(searchParams.get("path"), data, callback)'],
      ['writeFileSync(', 'writeFileSync(req.query.path, data)'],
      ['readdir(', 'readdir(params.dir, callback)'],
      ['createReadStream(', 'createReadStream(req.query.file)'],
    ])('returns a vulnerability for %s with user input', (_, rawContent) => {
      const route = buildRouteFile({ rawContent })
      const result = pathTraversal.check(route, buildContext())
      expect(result).toHaveLength(1)
    })
  })

  describe('when route has path sanitization', () => {
    it.each([
      ['path.resolve(', 'const safe = path.resolve(BASE_DIR, params.name)'],
      ['path.normalize(', 'const safe = path.normalize(params.name)'],
      ['resolve(process.cwd()', 'const safe = resolve(process.cwd(), "files", params.name)'],
      ['resolve(__dirname', 'const safe = resolve(__dirname, params.name)'],
      ['allowedPaths', 'if (!allowedPaths.includes(params.name)) return'],
    ])('returns no vulnerabilities when route uses %s', (_, rawContent) => {
      const route = buildRouteFile({ rawContent: `readFileSync(params.name)\n${rawContent}` })
      expect(pathTraversal.check(route, buildContext())).toHaveLength(0)
    })
  })

  describe('fix suggestion', () => {
    it('includes path.resolve in the code example', () => {
      const result = pathTraversal.check(buildRouteFile(), buildContext())
      expect(result[0]?.fix.codeExample).toContain('resolve(')
      expect(result[0]?.fix.codeExample).toContain('startsWith')
    })

    it('always returns low effort', () => {
      const result = pathTraversal.check(buildRouteFile(), buildContext())
      expect(result[0]?.fix.effort).toBe('low')
    })
  })
})
