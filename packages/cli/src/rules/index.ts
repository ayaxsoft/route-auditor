import type { AuditRule } from '../types'
import { unprotectedApiRoute } from './unprotected-api-route'
import { missingCsrfProtection } from './missing-csrf-protection'
import { missingRateLimit } from './missing-rate-limit'
import { permissiveCors } from './permissive-cors'
import { missingInputValidation } from './missing-input-validation'
import { exposedEnvVariable } from './exposed-env-variable'
import { unprotectedSensitivePage } from './unprotected-sensitive-page'
import { openRedirect } from './open-redirect'

export const ALL_RULES: AuditRule[] = [
  unprotectedApiRoute,
  missingCsrfProtection,
  missingRateLimit,
  permissiveCors,
  missingInputValidation,
  exposedEnvVariable,
  unprotectedSensitivePage,
  openRedirect,
]
