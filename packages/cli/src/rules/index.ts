import type { AuditRule } from '../types'
import { unprotectedApiRoute } from './unprotected-api-route'

export const ALL_RULES: AuditRule[] = [unprotectedApiRoute]
