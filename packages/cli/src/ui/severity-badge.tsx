import type { FC } from 'react'
import { Text } from 'ink'
import type { Severity } from '../types'
import { SEVERITY_COLOR } from '../utils/severity-color'

interface SeverityBadgeProps {
  severity: Severity
}

export const SeverityBadge: FC<SeverityBadgeProps> = ({ severity }) => {
  const { color, bold } = SEVERITY_COLOR[severity]
  return (
    <Text color={color} bold={bold}>
      [{severity.toUpperCase()}]
    </Text>
  )
}
