import type { FC } from 'react'
import { Box, Text } from 'ink'
import { render } from 'ink'
import type { AuditConfig, AuditRule } from '../types'
import { SEVERITY_COLOR } from '../utils/severity-color'
import { isRuleEnabled } from '../commands/rules'

interface RulesListProps {
  rules: AuditRule[]
  config: AuditConfig
}

const RulesList: FC<RulesListProps> = ({ rules, config }) => (
  <Box flexDirection="column" marginTop={1} marginBottom={1}>
    {rules.map((innerRule) => {
      const enabled = isRuleEnabled(innerRule.id, config)
      const { color, bold } = SEVERITY_COLOR[innerRule.severity]
      return (
        <Box key={innerRule.id}>
          <Text color={enabled ? 'green' : undefined} dimColor={!enabled}>
            {enabled ? '✔' : '✗'}
          </Text>
          <Text> </Text>
          <Text dimColor>{innerRule.id.padEnd(16)}</Text>
          <Text> </Text>
          <Text
            color={enabled ? color : undefined}
            bold={enabled ? bold : false}
            dimColor={!enabled}
          >
            {innerRule.severity.padEnd(8)}
          </Text>
          <Text dimColor={!enabled}>{innerRule.name}</Text>
        </Box>
      )
    })}
  </Box>
)

export const renderRulesList = (rules: AuditRule[], config: AuditConfig): void => {
  const { unmount } = render(<RulesList rules={rules} config={config} />)
  unmount()
}
