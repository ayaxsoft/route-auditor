import type { FC } from 'react'
import { Box, Text } from 'ink'
import { render } from 'ink'
import { Spinner } from '@inkjs/ui'
import type { AuditResult } from '../types'
import { Header } from './header'
import { AuditReport } from './audit-report'

type ScanPhase = 'scanning' | 'success' | 'error'

interface AuditViewProps {
  phase: ScanPhase
  result: AuditResult | null
  error: string | null
  watching: boolean
  changedFile: string | null
}

const AuditView: FC<AuditViewProps> = ({ phase, result, error, watching, changedFile }) => (
  <Box flexDirection="column">
    <Header />
    {changedFile !== null && (
      <Box flexDirection="column" marginTop={1} paddingLeft={2}>
        <Text dimColor>{'─'.repeat(60)}</Text>
        <Box>
          <Text dimColor>Changed: </Text>
          <Text bold>{changedFile}</Text>
        </Box>
        <Text dimColor>{'─'.repeat(60)}</Text>
      </Box>
    )}
    <Box marginTop={1} paddingLeft={2}>
      {phase === 'scanning' && <Spinner label="Scanning routes..." />}
      {phase === 'error' && <Text color="red">✗ {error}</Text>}
    </Box>
    {phase === 'success' &&
      result !== null &&
      (result.routes.length === 0 ? (
        <Box paddingLeft={2}>
          <Text color="yellow">⚠ No routes found — is this a Next.js project?</Text>
        </Box>
      ) : (
        <AuditReport result={result} />
      ))}
    {watching && phase !== 'scanning' && (
      <Box paddingLeft={2} marginBottom={1}>
        <Text dimColor>Watching for changes… Press Ctrl+C to stop.</Text>
      </Box>
    )}
  </Box>
)

const buildAuditViewProps = (overrides: Partial<AuditViewProps>): AuditViewProps => ({
  phase: 'scanning',
  result: null,
  error: null,
  watching: false,
  changedFile: null,
  ...overrides,
})

export const renderAuditView = (initialProps: Partial<AuditViewProps>) => {
  const { rerender: inkRerender, unmount } = render(
    <AuditView {...buildAuditViewProps(initialProps)} />,
  )
  return {
    rerender: (nextProps: Partial<AuditViewProps>) =>
      inkRerender(<AuditView {...buildAuditViewProps(nextProps)} />),
    unmount,
  }
}
