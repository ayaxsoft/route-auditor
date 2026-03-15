import { AuditContext, DetectedStack, RouteFile } from '../types'

const AUTH_SIGNATURES: Record<NonNullable<DetectedStack['auth']>, string[]> = {
  'next-auth': ['getServerSession', 'getToken', 'next-auth'],
  'auth-js': ['getServerSession', 'getToken', '@auth/'],
  clerk: ['auth()', 'currentUser()', '@clerk/', 'clerkClient'],
  lucia: ['validateRequest', 'lucia'],
  'better-auth': ['auth.api', 'better-auth', 'fromNodeHeaders'],
  supabase: ['supabase.auth', '@supabase/', 'createClient'],
  custom: ['auth', 'session', 'token', 'user'],
}

const hasAuthSignature = (rawContent: string, signatures: string[]): boolean => {
  return signatures.some((innerSignature) => rawContent.includes(innerSignature))
}

export const detectsAuth = (
  route: RouteFile,
  context: AuditContext,
  signatures: string[],
): boolean => {
  const { detectedStack } = context
  const { rawContent } = route

  if (detectedStack.auth) {
    const signatures = AUTH_SIGNATURES[detectedStack.auth]
    if (hasAuthSignature(rawContent, signatures)) return true
  }

  return hasAuthSignature(rawContent, signatures)
}
