import type { AuditRule } from '../types'
import { unprotectedApiRoute } from './unprotected-api-route'
import { missingCsrfProtection } from './missing-csrf-protection'

export const ALL_RULES: AuditRule[] = [unprotectedApiRoute, missingCsrfProtection]
