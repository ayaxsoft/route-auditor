import type { AuditResult, AuditConfig } from '../types'

export async function runAudit(
  _projectRoot: string,
  _config: AuditConfig = {},
): Promise<AuditResult> {
  throw new Error('Not implemented yet')
}