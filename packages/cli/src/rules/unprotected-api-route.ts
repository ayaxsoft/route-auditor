import type {
  AuditRule,
  AuditContext,
  RouteFile,
  Vulnerability,
  DetectedStack,
  Fix,
} from '../types'
import { detectsAuth } from '../utils/detect-auth'

const GENERIC_AUTH_SIGNATURES = [
  'Authorization',
  'Bearer',
  'getServerSession',
  'validateToken',
  'requireAuth',
  'withAuth',
  'isAuthenticated',
  'checkAuth',
]

const AUTH_FIX: Record<NonNullable<DetectedStack['auth']>, Fix> = {
  'next-auth': {
    description:
      'Use getServerSession(authOptions) to verify the session before processing the request.',
    effort: 'low',
    codeExample: `import { getServerSession } from 'next-auth'\nimport { authOptions } from '@/lib/auth'\n\nconst session = await getServerSession(authOptions)\nif (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })`,
  },
  'auth-js': {
    description: 'Use getServerSession() from @auth/nextjs to verify the session.',
    effort: 'low',
    codeExample: `import { auth } from '@/auth'\n\nconst session = await auth()\nif (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })`,
  },
  clerk: {
    description: 'Use auth() from @clerk/nextjs to verify the user is authenticated.',
    effort: 'low',
    codeExample: `import { auth } from '@clerk/nextjs/server'\n\nconst { userId } = await auth()\nif (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })`,
  },
  lucia: {
    description: 'Call validateRequest() to verify the session before processing the request.',
    effort: 'low',
    codeExample: `const { user, session } = await validateRequest()\nif (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })`,
  },
  'better-auth': {
    description: 'Use auth.api.getSession() with fromNodeHeaders to verify the session.',
    effort: 'low',
    codeExample: `import { auth } from '@/lib/auth'\nimport { fromNodeHeaders } from 'better-auth/node'\n\nconst session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) })\nif (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })`,
  },
  supabase: {
    description: 'Use createClient() and check getUser() before processing the request.',
    effort: 'low',
    codeExample: `import { createClient } from '@/utils/supabase/server'\n\nconst supabase = createClient()\nconst { data: { user } } = await supabase.auth.getUser()\nif (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })`,
  },
  custom: {
    description:
      'Verify the session or token from your auth implementation before processing the request.',
    effort: 'low',
  },
}

const GENERIC_FIX: Fix = {
  description:
    'Add an authentication check at the top of the handler and return 401 if the user is not authenticated.',
  effort: 'low',
}

const buildFix = (detectedAuth: DetectedStack['auth']): Fix => {
  if (detectedAuth) return AUTH_FIX[detectedAuth]
  return GENERIC_FIX
}

export const unprotectedApiRoute: AuditRule = {
  id: 'RW-AUTH-001',
  name: 'Unprotected API Route',
  description: 'API route does not appear to have authentication checks.',
  severity: 'high',
  category: 'authentication',
  enabled: true,
  check(route: RouteFile, context: AuditContext): Vulnerability[] {
    if (!route.isApiRoute) return []
    if (detectsAuth(route, context, GENERIC_AUTH_SIGNATURES)) return []

    return [
      {
        id: 'RW-AUTH-001',
        title: 'Unprotected API Route',
        description: `The API route ${route.routePath} does not appear to have authentication checks. Any user can access this endpoint.`,
        severity: 'high',
        category: 'authentication',
        owasp: 'A01:2021 – Broken Access Control',
        filePath: route.filePath,
        routePath: route.routePath,
        fix: buildFix(context.detectedStack.auth),
      },
    ]
  },
}
