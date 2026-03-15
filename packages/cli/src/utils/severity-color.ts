import type { ChalkInstance } from 'chalk'
import type { Severity } from '../types'
import chalk from 'chalk'

export const SEVERITY_COLOR: Record<Severity, ChalkInstance> = {
  critical: chalk.red.bold,
  high: chalk.red,
  medium: chalk.yellow,
  low: chalk.blue,
  info: chalk.gray,
}
