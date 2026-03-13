// ─── Primitives ───────────────────────────────────────────────────────────────

export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info'

export type VulnerabilityCategory =
  | 'authentication'
  | 'authorization'
  | 'injection'
  | 'exposure'
  | 'configuration'
  | 'secrets'
  | 'rate-limiting'
  | 'cors'
  | 'path-traversal'

export type RouterType = 'app' | 'pages' | 'mixed'

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS' | 'ALL' // Pages Router sin req.method check

// ─── Detected stack ──────────────────────────────────────────────────────────

export interface DetectedStack {
  auth?: 'better-auth' | 'clerk' | 'lucia' | 'next-auth' | 'auth-js' | 'supabase' | 'custom'
  orm?: 'prisma' | 'drizzle' | 'mongoose' | 'raw'
  validation?: 'zod' | 'yup' | 'joi' | 'valibot'
  email?: 'resend' | 'nodemailer' | 'sendgrid'
  rateLimit?: 'upstash' | 'custom'
}

// ─── Next.js route ──────────────────────────────────────────────────────────

export interface RouteFile {
  projectRoot: string // absolute path to the Next.js app root
  filePath: string // absolute file path on disk
  routePath: string // URL: /api/users/[id]
  routerType: RouterType
  isApiRoute: boolean
  isDynamic: boolean
  dynamicSegments: string[] // ['id'] para /api/users/[id]
  hasCatchAll: boolean // true if it has [...slug]
  hasOptionalCatchAll: boolean // true if it has [[...slug]]
  methods: HttpMethod[]
  exports: string[]
  rawContent: string // raw content — used by rules
}

// ─── Suggested fix ─────────────────────────────────────────────────────────────

export interface Fix {
  description: string
  effort: 'trivial' | 'low' | 'medium' | 'high'
  codeExample?: string // specific code for the project's stack
  docs?: string // URL to relevant documentation
}

// ─── Vulnerability ───────────────────────────────────────────────────────────

export interface Vulnerability {
  id: string // RW-AUTH-001
  title: string
  description: string
  severity: Severity
  category: VulnerabilityCategory
  cwe?: string // Common Weakness Enumeration
  owasp?: string // A01:2021 – Broken Access Control
  filePath: string
  routePath: string
  line?: number
  codeSnippet?: string
  fix: Fix
  references?: string[]
}

// ─── Audit configuration ──────────────────────────────────────────────────

export interface AuditConfig {
  rules?: Record<string, boolean | { severity?: Severity }>
  ignore?: string[] // glob patterns of routes to ignore
  severity?: Severity // minimum severity to report
  output?: 'console' | 'json' | 'sarif'
  outputFile?: string
  failOn?: Severity // exit code 1 if there are vulnerabilities of this severity or higher
}

// ─── Context that receives each rule ───────────────────────────────────────────

export interface AuditContext {
  projectRoot: string
  routerType: RouterType
  nextVersion?: string
  detectedStack: DetectedStack
  config: AuditConfig
  allRoutes: RouteFile[] // all routes — for rules that need global context
}

// ─── Audit rule ───────────────────────────────────────────────────────

export interface AuditRule {
  id: string
  name: string
  description: string
  severity: Severity // base severity — can be dynamic within check()
  category: VulnerabilityCategory
  enabled: boolean
  check(route: RouteFile, context: AuditContext): Vulnerability[]
}

// ─── Audit result ───────────────────────────────────────────────────────

export interface AuditSummary {
  totalRoutes: number
  totalApiRoutes: number
  totalVulnerabilities: number
  bySeverity: Record<Severity, number>
  byCategory: Partial<Record<VulnerabilityCategory, number>>
  score: number // 0-100, higher is better
}

export interface AuditResult {
  projectRoot: string
  nextVersion?: string
  routerType: RouterType
  detectedStack: DetectedStack
  scannedAt: string // ISO timestamp
  routes: RouteFile[]
  vulnerabilities: Vulnerability[]
  summary: AuditSummary
  duration: number // milliseconds
}

// ─── Utils ─────────────────────────────────────────────────────────────────────

export interface RawRouteFile {
  filePath: string
  routerType: Exclude<RouterType, 'mixed'>
}

export interface DynamicSegments {
  isDynamic: boolean
  dynamicSegments: string[]
  hasCatchAll: boolean
  hasOptionalCatchAll: boolean
}
