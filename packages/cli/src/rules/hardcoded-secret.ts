import type { AuditRule, AuditContext, RouteFile, Vulnerability } from '../types'
import { MIN_SECRET_VALUE_LENGTH } from '../constants'

const SECRET_VARIABLE_NAMES = [
  'secret',
  'apikey',
  'api_key',
  'password',
  'passwd',
  'privatekey',
  'private_key',
  'authtoken',
  'auth_token',
  'accesstoken',
  'access_token',
  'clientsecret',
  'client_secret',
]

const KNOWN_SECRET_PATTERNS: RegExp[] = [
  /sk_live_[a-zA-Z0-9]{20,}/,
  /sk_test_[a-zA-Z0-9]{20,}/,
  /ghp_[a-zA-Z0-9]{20,}/,
  /ghs_[a-zA-Z0-9]{20,}/,
  /xoxb-[0-9]+-[a-zA-Z0-9-]+/,
  /AIza[0-9A-Za-z_-]{35}/,
  /AKIA[0-9A-Z]{16}/,
]

const findHardcodedByVariableName = (rawContent: string): string[] => {
  const found: string[] = []

  for (const line of rawContent.split('\n')) {
    const trimmedLine = line.trim()
    if (trimmedLine.startsWith('//') || trimmedLine.startsWith('*')) continue
    if (trimmedLine.includes('process.env.')) continue
    if (trimmedLine.includes('import.meta.env.')) continue

    const lowerLine = trimmedLine.toLowerCase()
    for (const secretName of SECRET_VARIABLE_NAMES) {
      if (!lowerLine.includes(secretName)) continue
      if (new RegExp(`=\\s*['"][^'"]{${MIN_SECRET_VALUE_LENGTH},}['"]`).test(trimmedLine)) {
        found.push(secretName)
        break
      }
    }
  }

  return found
}

const findKnownSecretPatterns = (rawContent: string): string[] => {
  const found: string[] = []
  for (const pattern of KNOWN_SECRET_PATTERNS) {
    if (pattern.test(rawContent)) found.push(pattern.source.split('[')[0])
  }
  return found
}

const extractHardcodedSecrets = (rawContent: string): string[] => {
  const byName = findHardcodedByVariableName(rawContent)
  const byPattern = findKnownSecretPatterns(rawContent)
  return [...new Set([...byName, ...byPattern])]
}

export const hardcodedSecret: AuditRule = {
  id: 'RW-SECRET-001',
  name: 'Hardcoded Secret',
  description: 'Route appears to contain hardcoded secrets or credentials in source code.',
  severity: 'critical',
  category: 'secrets',
  enabled: true,
  check(route: RouteFile, _context: AuditContext): Vulnerability[] {
    const secrets = extractHardcodedSecrets(route.rawContent)
    if (secrets.length === 0) return []

    return [
      {
        id: 'RW-SECRET-001',
        title: 'Hardcoded Secret',
        description: `The route ${route.routePath} appears to contain hardcoded secrets (${secrets.join(', ')}). Committing secrets to source control exposes them to anyone with repository access.`,
        severity: 'critical',
        category: 'secrets',
        owasp: 'A02:2021 – Cryptographic Failures',
        filePath: route.filePath,
        routePath: route.routePath,
        fix: {
          description:
            'Move all secrets to environment variables and access them via process.env. Use a .env.local file locally and configure secrets in your deployment platform.',
          effort: 'low',
          codeExample: `// BAD\nconst apiKey = 'sk_live_abc123...'\n\n// GOOD\nconst apiKey = process.env.STRIPE_SECRET_KEY`,
        },
      },
    ]
  },
}
