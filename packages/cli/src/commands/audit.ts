import type { AuditConfig, AuditResult, Severity } from '../types'
import { Command, Option } from 'commander'
import { resolve } from 'path'
import { writeFileSync, existsSync, statSync } from 'fs'
import { runAudit } from '../analyzers/engine'
import { ALL_RULES } from '../rules'
import { renderAuditView } from '../ui/audit-view'
import { renderJsonReport } from '../reporters/json'
import { renderSarifReport } from '../reporters/sarif'
import { SEVERITY_ORDER } from '@route-auditor/shared'
import { loadConfig } from '../utils/load-config'
import { watchRoutes } from '../utils/watch'

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
  watch?: boolean
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
  .option('-w, --watch', 'Watch for file changes and re-run the audit')
  .action(async (directory: string, options: AuditOptions) => {
    const projectRoot = resolve(directory)

    if (!existsSync(projectRoot) || !statSync(projectRoot).isDirectory()) {
      console.error(`\n  ✗ Directory not found: ${projectRoot}\n`)
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

    if (!isConsoleOutput) {
      let rendered: string
      try {
        const result = await runAudit(projectRoot, config)
        rendered =
          config.output === 'sarif'
            ? renderSarifReport(result, ALL_RULES)
            : renderJsonReport(result)
      } catch (error) {
        console.error(error instanceof Error ? error.message : 'Audit failed')
        process.exit(1)
      }

      if (config.outputFile) {
        writeFileSync(resolve(config.outputFile), rendered, 'utf-8')
        console.log(`Output written to ${config.outputFile}`)
      } else {
        console.log(rendered)
      }
      return
    }

    const { rerender, unmount } = renderAuditView({ phase: 'scanning' })

    let result: AuditResult | null = null
    try {
      result = await runAudit(projectRoot, config)
      rerender({ phase: 'success', result, watching: Boolean(options.watch) })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Audit failed'
      rerender({ phase: 'error', error: message })
      unmount()
      process.exit(1)
    }

    if (options.watch) {
      let currentChangedFile: string | null = null

      const stopWatching = watchRoutes(projectRoot, configPath, async (changedFile) => {
        currentChangedFile = changedFile
        rerender({ phase: 'scanning', result, watching: true, changedFile: currentChangedFile })
        try {
          result = await runAudit(projectRoot, config)
          rerender({ phase: 'success', result, watching: true, changedFile: currentChangedFile })
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Audit failed'
          rerender({
            phase: 'error',
            error: message,
            watching: true,
            changedFile: currentChangedFile,
          })
        }
      })

      process.once('SIGINT', () => {
        stopWatching()
        unmount()
        process.exit(0)
      })
      return
    }

    unmount()

    if (!result) process.exit(1)

    if (config.failOn) {
      const shouldFail = result.vulnerabilities.some((innerVulnerability) =>
        meetsFailThreshold(innerVulnerability.severity, config.failOn!),
      )
      if (shouldFail) process.exit(1)
    }
  })
