import type { AuditResult, Severity, Vulnerability } from '../types'
import { relative } from 'path'
import chalk from 'chalk'
import boxen from 'boxen'
import { SEVERITY_COLOR } from '../utils/severity-color'

const BAR_WIDTH = 40
const BAR_FILLED = '█'
const BAR_EMPTY = '░'

const EFFORT_LABEL: Record<string, string> = {
  trivial: 'trivial',
  low: 'low effort',
  medium: 'medium effort',
  high: 'high effort',
}

const scoreLabel = (score: number): { text: string; color: ChalkInstance } => {
  if (score >= 80) return { text: 'Good', color: chalk.green.bold }
  if (score >= 60) return { text: 'Medium', color: chalk.yellow.bold }
  if (score >= 40) return { text: 'High', color: chalk.red }
  return { text: 'Critical', color: chalk.red.bold }
}

const renderScoreBar = (score: number): string => {
  const filledCount = Math.round((score / 100) * BAR_WIDTH)
  const emptyCount = BAR_WIDTH - filledCount
  const { color } = scoreLabel(score)
  const filled = color(BAR_FILLED.repeat(filledCount))
  const empty = chalk.dim(BAR_EMPTY.repeat(emptyCount))
  return filled + empty
}

const groupVulnerabilitiesByTitle = (
  vulnerabilities: Vulnerability[],
): Map<string, Vulnerability[]> =>
  vulnerabilities.reduce((accumulator, innerVulnerability) => {
    const existing = accumulator.get(innerVulnerability.title) ?? []
    return accumulator.set(innerVulnerability.title, [...existing, innerVulnerability])
  }, new Map<string, Vulnerability[]>())

const renderSeverityBadge = (severity: Severity): string => {
  const color = SEVERITY_COLOR[severity]
  return color(`[${severity.toUpperCase()}]`)
}

const renderVulnerabilityGroup = (
  title: string,
  innerVulnerabilities: Vulnerability[],
  projectRoot: string,
): void => {
  const severity = innerVulnerabilities[0]?.severity ?? 'info'
  const fix = innerVulnerabilities[0]?.fix
  const owasp = innerVulnerabilities[0]?.owasp
  const count = innerVulnerabilities.length

  const badge = renderSeverityBadge(severity)
  const routeCount = chalk.dim(`${count} route${count === 1 ? '' : 's'}`)
  console.log(`  ${badge} ${chalk.bold(title)} ${routeCount}`)

  if (owasp) {
    console.log(`       ${chalk.dim(owasp)}`)
  }

  console.log()

  for (const innerVulnerability of innerVulnerabilities) {
    const route = chalk.cyan(innerVulnerability.routePath.padEnd(35))
    const file = chalk.dim(relative(projectRoot, innerVulnerability.filePath))
    console.log(`       ${chalk.dim('→')} ${route} ${file}`)
  }

  if (fix) {
    console.log()
    const effort = EFFORT_LABEL[fix.effort] ?? fix.effort
    console.log(`       ${chalk.dim('Fix:')} ${fix.description} ${chalk.dim(`(${effort})`)}`)
  }
}

export const renderHeader = (): void => {
  const header = boxen(
    `${chalk.cyan.bold('⚡ route-auditor')}\n${chalk.dim('Audit Next.js routes for security issues.')}`,
    { padding: { top: 0, bottom: 0, left: 1, right: 1 }, borderStyle: 'none' },
  )
  console.log(header)
}

export const renderConsoleReport = (result: AuditResult): void => {
  console.log()

  if (result.vulnerabilities.length === 0) {
    console.log(chalk.green.bold('  ✔ No vulnerabilities found'))
  } else {
    const grouped = groupVulnerabilitiesByTitle(result.vulnerabilities)

    for (const [title, innerVulnerabilities] of grouped) {
      renderVulnerabilityGroup(title, innerVulnerabilities, result.projectRoot)
      console.log()
    }
  }

  const { score } = result.summary
  const { text, color } = scoreLabel(score)
  console.log(`  ${chalk.bold(`${score}`)} ${chalk.dim('/ 100')} ${color(text)}`)
  console.log(`  ${renderScoreBar(score)}`)

  console.log()

  const errorWord = result.vulnerabilities.length === 1 ? 'vulnerability' : 'vulnerabilities'
  const durationInSeconds = (result.duration / 1000).toFixed(1)
  const errorCount =
    result.vulnerabilities.length > 0
      ? chalk.red.bold(`${result.vulnerabilities.length} ${errorWord}`)
      : chalk.green.bold(`0 ${errorWord}`)

  console.log(
    `  ${errorCount} ${chalk.dim(`across ${result.routes.length} routes in ${durationInSeconds}s`)}`,
  )
  console.log()
}
