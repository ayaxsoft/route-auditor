import type { AuditResult } from '../types'

export const renderJsonReport = (result: AuditResult): string => JSON.stringify(result, null, 2)
