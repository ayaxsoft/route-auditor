import type { AuditConfig, Severity } from '../types'
import { Command, Option } from 'commander'
import { resolve } from 'path'
import { writeFileSync, existsSync, statSync } from 'fs'
import chalk from 'chalk'
import ora from 'ora'
import { runAudit } from '../analyzers/engine'
import { ALL_RULES } from '../rules'
import { renderHeader, renderConsoleReport } from '../reporters/console'
import { renderJsonReport } from '../reporters/json'
import { renderSarifReport } from '../reporters/sarif'
import { SEVERITY_ORDER } from '@route-auditor/shared'
import { loadConfig } from '../utils/load-config'

const meetsFailThreshold = (severity: Severity, failOn: Severity): boolean =>
  SEVERITY_ORDER.indexOf(severity) <= SEVERITY_ORDER.indexOf(failOn)

const loadConfigFile = (configPath: string): AuditConfig => {
  if (!existsSync(configPath)) {
    console.error(`Config file not found: ${configPath}`)
    process.exit(1)
  }
  return loadConfig(configPath)
}

interface AuditOptions {
  output: 'console' | 'json' | 'sarif'
  severity: Severity
  failOn?: Severity
  file?: string
  config?: string
}

export const auditCommand = new Command('audit')
  .description('Audit Next.js routes for security vulnerabilities')
  .argument('[directory]', 'Path to Next.js project root', '.')
  .addOption(
    new Option('-o, --output <format>', 'Output format')
      .choices(['console', 'json', 'sarif'])
      .default('console'),
  )
  .addOption(
    new Option('-s, --severity <level>', 'Minimum severity to report')
      .choices(['critical', 'high', 'medium', 'low', 'info'])
      .default('info'),
  )
  .addOption(
    new Option(
      '--fail-on <level>',
      'Exit with code 1 if vulnerabilities of this level or higher are found',
    ).choices(['critical', 'high', 'medium', 'low', 'info']),
  )
  .option('--file <path>', 'Write output to file instead of stdout')
  .option('--config <path>', 'Path to route-auditor.config.json')
  .action(async (directory: string, options: AuditOptions) => {
    const projectRoot = resolve(directory)

    if (!existsSync(projectRoot) || !statSync(projectRoot).isDirectory()) {
      console.error(`\n  ${chalk.red('✗')} Directory not found: ${chalk.bold(projectRoot)}\n`)
      process.exit(1)
    }

    const configPath = options.config
      ? resolve(options.config)
      : existsSync(resolve(projectRoot, 'route-auditor.config.json'))
        ? resolve(projectRoot, 'route-auditor.config.json')
        : existsSync(resolve('route-auditor.config.json'))
          ? resolve('route-auditor.config.json')
          : null

    const fileConfig: AuditConfig = configPath ? loadConfigFile(configPath) : {}

    const config: AuditConfig = {
      ...fileConfig,
      severity: options.severity ?? fileConfig.severity ?? 'info',
      output: options.output ?? fileConfig.output ?? 'console',
      outputFile: options.file ?? fileConfig.outputFile,
      failOn: options.failOn ?? fileConfig.failOn,
    }

    const isConsoleOutput = config.output === 'console' && !config.outputFile

    if (isConsoleOutput) {
      renderHeader()
      console.log()
    }

    const spinner = isConsoleOutput ? ora('Scanning routes...').start() : null

    let result
    try {
      result = await runAudit(projectRoot, config)
      if (result.routes.length === 0) {
        spinner?.warn('No routes found — is this a Next.js project?')
      } else {
        spinner?.succeed(`Scanned ${result.routes.length} routes in ${result.duration}ms`)
      }
    } catch (error) {
      spinner?.fail(error instanceof Error ? error.message : 'Audit failed')
      process.exit(1)
    }

    const output = config.output

    let rendered: string | null = null
    if (output === 'json') {
      rendered = renderJsonReport(result)
    } else if (output === 'sarif') {
      rendered = renderSarifReport(result, ALL_RULES)
    } else {
      renderConsoleReport(result)
    }

    if (rendered !== null) {
      if (config.outputFile) {
        writeFileSync(resolve(config.outputFile), rendered, 'utf-8')
        console.log(`Output written to ${config.outputFile}`)
      } else {
        console.log(rendered)
      }
    }

    if (config.failOn) {
      const shouldFail = result.vulnerabilities.some((vulnerability) =>
        meetsFailThreshold(vulnerability.severity, config.failOn!),
      )
      if (shouldFail) process.exit(1)
    }
  })
