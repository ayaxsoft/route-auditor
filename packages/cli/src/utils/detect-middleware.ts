import { existsSync, readFileSync } from 'fs'
import { join } from 'path'

const MIDDLEWARE_AUTH_SIGNATURES = [
  'getToken',
  'getServerSession',
  'auth(',
  'currentUser',
  'validateRequest',
  'auth.api',
  'supabase.auth',
  'withAuth',
  'clerkMiddleware',
  'authMiddleware',
  'createRouteMatcher',
  'isProtectedRoute',
  'requireAuth',
  'isAuthenticated',
  'session',
  'token',
]

const MIDDLEWARE_CANDIDATES = [
  'src/proxy.ts',
  'src/proxy.js',
  'proxy.ts',
  'proxy.js',
  'src/middleware.ts',
  'src/middleware.js',
  'middleware.ts',
  'middleware.js',
  'pages/_middleware.ts',
  'pages/_middleware.js',
]

const hasAuthLogic = (fileContent: string): boolean =>
  MIDDLEWARE_AUTH_SIGNATURES.some((signature) => fileContent.includes(signature))

const extractMatcher = (fileContent: string): string[] | undefined => {
  const matcherKeyIndex = fileContent.search(/matcher\s*:/)
  if (matcherKeyIndex === -1) return undefined

  const matcherKeyMatch = fileContent.slice(matcherKeyIndex).match(/matcher\s*:/)
  if (!matcherKeyMatch) return undefined

  const afterMatcherKey = fileContent.slice(matcherKeyIndex + matcherKeyMatch[0].length).trimStart()

  if (afterMatcherKey.startsWith('[')) {
    let bracketDepth = 0
    let closingIndex = 0

    for (let charIndex = 0; charIndex < afterMatcherKey.length; charIndex++) {
      if (afterMatcherKey[charIndex] === '[') bracketDepth++
      if (afterMatcherKey[charIndex] === ']') {
        bracketDepth--
        if (bracketDepth === 0) {
          closingIndex = charIndex
          break
        }
      }
    }

    const arrayString = afterMatcherKey.slice(0, closingIndex + 1)
    const quotedStrings = arrayString.match(/['"`]([^'"`]+)['"`]/g)
    if (quotedStrings) return quotedStrings.map((quotedString) => quotedString.slice(1, -1))
    return undefined
  }

  const singleStringMatch = afterMatcherKey.match(/^['"`]([^'"`]+)['"`]/)
  if (singleStringMatch?.[1]) return [singleStringMatch[1]]

  return undefined
}

const matchesPattern = (routePath: string, pattern: string): boolean => {
  if (pattern.includes('(?')) {
    try {
      return new RegExp(`^${pattern}$`).test(routePath)
    } catch {
      return false
    }
  }

  const regexString = pattern
    .replace(/\[([^\]]+)\]/g, '[^/]+') // [locale] → any single segment
    .replace(/\/:\w+\*/g, '(/.*)?') //    /:path*  → zero or more segments
    .replace(/\/:\w+\+/g, '(/.+)') //     /:path+  → one or more segments
    .replace(/\/:\w+/g, '/[^/]+') //      /:id     → exactly one segment
    .replace(/:\w+\*/g, '.*') //           :path*   → fallback without leading slash
    .replace(/:\w+\+/g, '.+')
    .replace(/:\w+/g, '[^/]+')

  try {
    return new RegExp(`^${regexString}$`).test(routePath)
  } catch {
    const beforeDynamicParam = pattern.split(':')[0] ?? pattern
    const beforeWildcard = beforeDynamicParam.split('*')[0] ?? beforeDynamicParam
    const staticPrefix = beforeWildcard.replace(/\[[^\]]+\]/g, '').replace(/\/\//g, '/')
    return routePath.startsWith(staticPrefix)
  }
}

const isCoveredByMatcher = (routePath: string, matcherPatterns: string[] | undefined): boolean => {
  if (matcherPatterns === undefined) return true
  return matcherPatterns.some((pattern) => matchesPattern(routePath, pattern))
}

const findMiddlewareFile = (projectRoot: string): string | null => {
  for (const candidate of MIDDLEWARE_CANDIDATES) {
    const fullPath = join(projectRoot, candidate)
    if (existsSync(fullPath)) return fullPath
  }
  return null
}

export const isRouteProtectedByMiddleware = (projectRoot: string, routePath: string): boolean => {
  try {
    const middlewareFilePath = findMiddlewareFile(projectRoot)
    if (!middlewareFilePath) return false

    const fileContent = readFileSync(middlewareFilePath, 'utf8')
    if (!hasAuthLogic(fileContent)) return false

    const matcherPatterns = extractMatcher(fileContent)
    return isCoveredByMatcher(routePath, matcherPatterns)
  } catch {
    return false
  }
}
