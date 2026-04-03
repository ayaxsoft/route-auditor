import type { FC } from 'react'
import { Box, Text } from 'ink'
import { render } from 'ink'
import type { AuditResult, Vulnerability } from '../types'
import { VulnerabilityGroup } from './vulnerability-group'
import { ScoreBar } from './score-bar'
import { Header } from './header'

const groupVulnerabilitiesByTitle = (
  vulnerabilities: Vulnerability[],
): Map<string, Vulnerability[]> =>
  vulnerabilities.reduce((accumulator, innerVulnerability) => {
    const existing = accumulator.get(innerVulnerability.title) ?? []
    return accumulator.set(innerVulnerability.title, [...existing, innerVulnerability])
  }, new Map<string, Vulnerability[]>())

interface AuditReportProps {
  result: AuditResult
}

export const AuditReport: FC<AuditReportProps> = ({ result }) => {
  const { score } = result.summary
  const durationInSeconds = (result.duration / 1000).toFixed(1)
  const count = result.vulnerabilities.length
  const errorWord = count === 1 ? 'vulnerability' : 'vulnerabilities'
  const grouped = groupVulnerabilitiesByTitle(result.vulnerabilities)

  return (
    <Box flexDirection="column">
      <Box marginTop={1} />
      {count === 0 ? (
        <Box paddingLeft={2}>
          <Text color="green" bold>
            ✔ No vulnerabilities found
          </Text>
        </Box>
      ) : (
        <Box flexDirection="column">
          {[...grouped.entries()].map(([title, innerVulnerabilities]) => (
            <Box key={title} flexDirection="column" marginBottom={1}>
              <VulnerabilityGroup
                title={title}
                vulnerabilities={innerVulnerabilities}
                projectRoot={result.projectRoot}
              />
            </Box>
          ))}
        </Box>
      )}
      <ScoreBar score={score} />
      <Box paddingLeft={2} marginTop={1}>
        {count > 0 ? (
          <Text color="red" bold>
            {count} {errorWord}
          </Text>
        ) : (
          <Text color="green" bold>
            0 {errorWord}
          </Text>
        )}
        <Text dimColor>
          {' '}
          across {result.routes.length} routes in {durationInSeconds}s
        </Text>
      </Box>
      <Box marginBottom={1} />
    </Box>
  )
}

export const renderAuditReportView = (result: AuditResult): void => {
  const { unmount } = render(
    <Box flexDirection="column">
      <Header />
      <AuditReport result={result} />
    </Box>,
  )
  unmount()
}
