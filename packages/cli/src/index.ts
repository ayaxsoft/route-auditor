// ─── Programmatic API ─────────────────────────────────────────────────────────

export { runAudit } from './analyzers/engine'
export { scanRoutes, detectRouterType } from './analyzers/scanner'
export { detectStack } from './analyzers/detector'

export type {
  AuditResult,
  AuditConfig,
  AuditRule,
  RouteFile,
  Vulnerability,
  DetectedStack,
  Severity,
  RouterType,
} from '@route-auditor/shared'

// ─── CLI ──────────────────────────────────────────────────────────────────────

import { Command } from 'commander'
import { auditCommand } from './commands/audit'
import { initCommand } from './commands/init'
import { reportCommand } from './commands/report'

const program = new Command()

program.name('route-auditor').description('Security auditor for Next.js routes').version('1.0.0')

program.addCommand(auditCommand)
program.addCommand(initCommand)
program.addCommand(reportCommand)

program.parse(process.argv)
