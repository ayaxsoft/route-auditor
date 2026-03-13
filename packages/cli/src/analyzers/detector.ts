import { readPackageJson } from '../utils/read-package-json'
import { collectDependencies } from '../utils/collect-dependencies'
import { detect } from '../utils/detect-from-map'
import type { DetectedStack } from '../types'

const AUTH_MAP: Record<string, DetectedStack['auth']> = {
  'better-auth': 'better-auth',
  '@clerk/nextjs': 'clerk',
  '@clerk/clerk-sdk-node': 'clerk',
  lucia: 'lucia',
  'next-auth': 'next-auth',
  '@auth/nextjs': 'auth-js',
  '@supabase/ssr': 'supabase',
  '@supabase/auth-helpers-nextjs': 'supabase',
}

const ORM_MAP: Record<string, DetectedStack['orm']> = {
  '@prisma/client': 'prisma',
  'drizzle-orm': 'drizzle',
  mongoose: 'mongoose',
  pg: 'raw',
  mysql2: 'raw',
  'better-sqlite3': 'raw',
}

const VALIDATION_MAP: Record<string, DetectedStack['validation']> = {
  zod: 'zod',
  yup: 'yup',
  joi: 'joi',
  valibot: 'valibot',
}

const EMAIL_MAP: Record<string, DetectedStack['email']> = {
  resend: 'resend',
  nodemailer: 'nodemailer',
  sendgrid: 'sendgrid',
}

const RATE_LIMIT_MAP: Record<string, DetectedStack['rateLimit']> = {
  '@upstash/ratelimit': 'upstash',
  upstash: 'upstash',
  'next-rate-limit': 'custom',
}

export const detectStack = (projectRoot: string): DetectedStack => {
  const pkg = readPackageJson(projectRoot)
  const deps = collectDependencies(pkg)

  const auth = detect(deps, AUTH_MAP)
  const orm = detect(deps, ORM_MAP)
  const validation = detect(deps, VALIDATION_MAP)
  const email = detect(deps, EMAIL_MAP)
  const rateLimit = detect(deps, RATE_LIMIT_MAP)

  return { auth, orm, validation, email, rateLimit }
}
