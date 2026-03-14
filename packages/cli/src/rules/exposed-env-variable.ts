import type { AuditRule, AuditContext, RouteFile, Vulnerability } from '../types'

const SENSITIVE_ENV_PATTERNS = [
  '_SECRET',
  '_PRIVATE',
  '_PASSWORD',
  '_PASS',
  '_TOKEN',
  '_API_KEY',
  '_APIKEY',
  '_CREDENTIALS',
  '_CREDENTIAL',
  'DATABASE_URL',
  'DB_URL',
  'DB_PASSWORD',
  'WEBHOOK_SECRET',
  'SIGNING_SECRET',
  'ENCRYPTION_KEY',
  'PRIVATE_KEY',
  'SECRET_KEY',
]

const RESPONSE_SIGNATURES = [
  'Response.json(',
  'NextResponse.json(',
  'res.json(',
  'res.send(',
  'return {',
]

const extractSensitiveEnvAccess = (rawContent: string): string[] => {
  const found: string[] = []
  const lines = rawContent.split('\n')

  for (const innerLine of lines) {
    if (!innerLine.includes('process.env.')) continue

    const envStart = innerLine.indexOf('process.env.') + 'process.env.'.length
    const afterEnv = innerLine.slice(envStart)
    const envName = afterEnv.split(/[\s,;)\]}'"`]/)[0] ?? ''

    if (envName.startsWith('NEXT_PUBLIC_')) continue

    const upperEnvName = envName.toUpperCase()
    const isSensitive = SENSITIVE_ENV_PATTERNS.some((innerPattern) =>
      upperEnvName.includes(innerPattern),
    )

    if (isSensitive) found.push(envName)
  }

  return found
}

const hasResponseOutput = (rawContent: string): boolean =>
  RESPONSE_SIGNATURES.some((innerSignature) => rawContent.includes(innerSignature))

export const exposedEnvVariable: AuditRule = {
  id: 'RW-ENV-001',
  name: 'Potentially Exposed Environment Variable',
  description:
    'API route accesses sensitive environment variables and returns a response — the variable may be included in the output.',
  severity: 'high',
  category: 'exposure',
  enabled: true,
  check(route: RouteFile, _context: AuditContext): Vulnerability[] {
    if (!route.isApiRoute) return []
    if (!hasResponseOutput(route.rawContent)) return []

    const sensitiveVars = extractSensitiveEnvAccess(route.rawContent)
    if (sensitiveVars.length === 0) return []

    const varList = sensitiveVars.join(', ')

    return [
      {
        id: 'RW-ENV-001',
        title: 'Potentially Exposed Environment Variable',
        description: `The API route ${route.routePath} accesses ${varList} and returns a response. Verify these variables are not included in the output.`,
        severity: 'high',
        category: 'exposure',
        owasp: 'A02:2021 – Cryptographic Failures',
        filePath: route.filePath,
        routePath: route.routePath,
        fix: {
          description: `Ensure ${varList} is only used server-side (e.g. to sign, encrypt, or authenticate) and never serialized into the response body.`,
          effort: 'low',
          codeExample: `// BAD\nreturn Response.json({ key: process.env.SECRET_KEY })\n\n// GOOD — use it server-side only\nconst signed = sign(payload, process.env.SECRET_KEY)\nreturn Response.json({ token: signed })`,
        },
      },
    ]
  },
}
