import type {
  AuditRule,
  AuditContext,
  RouteFile,
  Vulnerability,
  DetectedStack,
  Fix,
} from '../types'
import { detectsAuth } from '../utils/detect-auth'

const SENSITIVE_PATH_SEGMENTS = [
  'admin',
  'dashboard',
  'settings',
  'profile',
  'account',
  'billing',
  'manage',
  'management',
  'panel',
  'console',
  'backoffice',
  'back-office',
  'portal',
  'internal',
  'private',
  'secure',
]

const GENERIC_AUTH_SIGNATURES = [
  'getServerSession',
  'requireAuth',
  'withAuth',
  'isAuthenticated',
  'checkAuth',
  'redirect',
  'notFound',
  'middleware',
]

const AUTH_FIX: Record<NonNullable<DetectedStack['auth']>, Fix> = {
  'next-auth': {
    description:
      'Use getServerSession() at the top of the page component and redirect to login if no session.',
    effort: 'low',
    codeExample: `import { getServerSession } from 'next-auth'\nimport { redirect } from 'next/navigation'\nimport { authOptions } from '@/lib/auth'\n\nexport default async function Page() {\n  const session = await getServerSession(authOptions)\n  if (!session) redirect('/login')\n  // render page\n}`,
  },
  'auth-js': {
    description: 'Use auth() at the top of the page component and redirect to login if no session.',
    effort: 'low',
    codeExample: `import { auth } from '@/auth'\nimport { redirect } from 'next/navigation'\n\nexport default async function Page() {\n  const session = await auth()\n  if (!session) redirect('/login')\n  // render page\n}`,
  },
  clerk: {
    description: 'Use auth() from @clerk/nextjs and redirect if the user is not authenticated.',
    effort: 'low',
    codeExample: `import { auth } from '@clerk/nextjs/server'\nimport { redirect } from 'next/navigation'\n\nexport default async function Page() {\n  const { userId } = await auth()\n  if (!userId) redirect('/sign-in')\n  // render page\n}`,
  },
  lucia: {
    description: 'Call validateRequest() and redirect if no valid session is found.',
    effort: 'low',
    codeExample: `import { redirect } from 'next/navigation'\n\nexport default async function Page() {\n  const { session } = await validateRequest()\n  if (!session) redirect('/login')\n  // render page\n}`,
  },
  'better-auth': {
    description: 'Use auth.api.getSession() and redirect if no session is found.',
    effort: 'low',
    codeExample: `import { auth } from '@/lib/auth'\nimport { headers } from 'next/headers'\nimport { redirect } from 'next/navigation'\n\nexport default async function Page() {\n  const session = await auth.api.getSession({ headers: await headers() })\n  if (!session) redirect('/login')\n  // render page\n}`,
  },
  supabase: {
    description: 'Use createClient() and check getUser() before rendering the page.',
    effort: 'low',
    codeExample: `import { createClient } from '@/utils/supabase/server'\nimport { redirect } from 'next/navigation'\n\nexport default async function Page() {\n  const supabase = createClient()\n  const { data: { user } } = await supabase.auth.getUser()\n  if (!user) redirect('/login')\n  // render page\n}`,
  },
  custom: {
    description:
      'Verify the session from your auth implementation and redirect to login if not authenticated.',
    effort: 'low',
  },
}

const GENERIC_FIX: Fix = {
  description:
    'Check for an active session at the top of the page and redirect to login if none is found.',
  effort: 'low',
  codeExample: `import { redirect } from 'next/navigation'\n\nexport default async function Page() {\n  const session = await getSession()\n  if (!session) redirect('/login')\n  // render page\n}`,
}

const isSensitivePage = (routePath: string): boolean =>
  SENSITIVE_PATH_SEGMENTS.some((innerSegment) => routePath.toLowerCase().includes(innerSegment))

const buildFix = (detectedAuth: DetectedStack['auth']): Fix =>
  detectedAuth ? AUTH_FIX[detectedAuth] : GENERIC_FIX

export const unprotectedSensitivePage: AuditRule = {
  id: 'RW-AUTH-003',
  name: 'Unprotected Sensitive Page',
  description: 'Page route with a sensitive path does not appear to have authentication checks.',
  severity: 'high',
  category: 'authentication',
  enabled: true,
  check(route: RouteFile, context: AuditContext): Vulnerability[] {
    if (route.isApiRoute) return []
    if (route.routerType !== 'app') return []
    if (!isSensitivePage(route.routePath)) return []
    if (detectsAuth(route, context, GENERIC_AUTH_SIGNATURES)) return []

    return [
      {
        id: 'RW-AUTH-003',
        title: 'Unprotected Sensitive Page',
        description: `The page ${route.routePath} appears to be a sensitive area but does not have authentication checks. Any user can access it directly.`,
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
