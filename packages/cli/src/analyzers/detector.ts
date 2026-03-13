/**
 * Detect the stack used in the project
 * This is the main function that will be used to detect the stack used in the project
 * It will scan the project for the presence of the stack
 * It will return a DetectedStack object
 */

import { join } from 'path'
import { readFileSync } from 'fs'
import type { DetectedStack } from '../types'

// --- Detection Maps ────────────────────────────────────────────────────────────
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

// --- Helper Functions ────────────────────────────────────────────────────────────
function readPackageJson(projectRoot: string): Record<string, unknown> {
  try {
    const raw = readFileSync(join(projectRoot, 'package.json'), 'utf8')
    return JSON.parse(raw) as Record<string, unknown>
  } catch (_error) {
    return {}
  }
}

function collectDependencies(pkg: Record<string, unknown>): Set<string> {
  const dependencies = new Set<string>()
  const sections = ['dependencies', 'devDependencies', 'peerDependencies']

  for (const section of sections) {
    const block = pkg[section]
    if (block && typeof block === 'object') {
      for (const name of Object.keys(block)) {
        dependencies.add(name)
      }
    }
  }

  return dependencies
}

function detect<T>(deps: Set<string>, map: Record<string, T>): T | undefined {
  for (const [pkg, value] of Object.entries(map)) {
    if (deps.has(pkg)) return value
  }
  return undefined
}

export function detectStack(projectRoot: string): DetectedStack {
  const pkg = readPackageJson(projectRoot)
  const deps = collectDependencies(pkg)

  const auth = detect(deps, AUTH_MAP)
  const orm = detect(deps, ORM_MAP)
  const validation = detect(deps, VALIDATION_MAP)
  const email = detect(deps, EMAIL_MAP)
  const rateLimit = detect(deps, RATE_LIMIT_MAP)

  return { auth, orm, validation, email, rateLimit }
}
