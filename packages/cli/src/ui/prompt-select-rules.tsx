import type { FC } from 'react'
import { Box, Text } from 'ink'
import { render } from 'ink'
import { MultiSelect } from '@inkjs/ui'
import type { AuditRule } from '../types'
import { SEVERITY_COLOR } from '../utils/severity-color'

const buildRuleOptionLabel = (innerRule: AuditRule): string => {
  const { color: _color, bold: _bold } = SEVERITY_COLOR[innerRule.severity]
  return `${innerRule.id.padEnd(16)} ${innerRule.severity.padEnd(8)} ${innerRule.name}`
}

interface PromptSelectRulesProps {
  rules: AuditRule[]
  message: string
  onSubmit: (selectedIds: string[]) => void
}

const PromptSelectRules: FC<PromptSelectRulesProps> = ({ rules, message, onSubmit }) => (
  <Box flexDirection="column" marginTop={1}>
    <Text bold>{message}</Text>
    <MultiSelect
      options={rules.map((innerRule) => ({
        label: buildRuleOptionLabel(innerRule),
        value: innerRule.id,
      }))}
      onSubmit={(selectedValues) => {
        onSubmit(selectedValues)
      }}
    />
  </Box>
)

export const promptSelectRules = (rules: AuditRule[], message: string): Promise<string[]> =>
  new Promise((resolve) => {
    const { unmount } = render(
      <PromptSelectRules
        rules={rules}
        message={message}
        onSubmit={(selectedIds) => {
          unmount()
          resolve(selectedIds)
        }}
      />,
    )
  })
