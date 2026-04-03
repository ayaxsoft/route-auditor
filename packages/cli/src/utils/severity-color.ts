import type { Severity } from '../types'

interface SeverityStyle {
  color: string
  bold?: boolean
}

export const SEVERITY_COLOR: Record<Severity, SeverityStyle> = {
  critical: { color: 'red', bold: true },
  high: { color: 'red' },
  medium: { color: 'yellow' },
  low: { color: 'blue' },
  info: { color: 'gray' },
}
