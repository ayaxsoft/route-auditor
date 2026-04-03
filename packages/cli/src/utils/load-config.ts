import type { AuditConfig } from '../types'
import { existsSync, readFileSync } from 'fs'

export const loadConfig = (configPath: string): AuditConfig => {
  if (!existsSync(configPath)) return {}
  try {
    return JSON.parse(readFileSync(configPath, 'utf-8')) as AuditConfig
  } catch {
    console.error(`\n  ✗ Failed to parse ${configPath} — is it valid JSON?\n`)
    process.exit(1)
  }
}
