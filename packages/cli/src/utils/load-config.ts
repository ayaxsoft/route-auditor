import type { AuditConfig } from '../types'
import { existsSync, readFileSync } from 'fs'
import chalk from 'chalk'

export const loadConfig = (configPath: string): AuditConfig => {
  if (!existsSync(configPath)) return {}
  try {
    return JSON.parse(readFileSync(configPath, 'utf-8')) as AuditConfig
  } catch {
    console.error(
      `\n  ${chalk.red('✗')} Failed to parse ${chalk.bold(configPath)} — is it valid JSON?\n`,
    )
    process.exit(1)
  }
}
