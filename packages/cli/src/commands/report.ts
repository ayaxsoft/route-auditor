import type { AuditResult } from '../types'
import { Command, Option } from 'commander'
import { resolve } from 'path'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import chalk from 'chalk'
import { ALL_RULES } from '../rules'
import { renderConsoleReport, renderHeader } from '../reporters/console'
import { renderJsonReport } from '../reporters/json'
import { renderSarifReport } from '../reporters/sarif'

interface ReportOptions {
  output: 'console' | 'json' | 'sarif'
  file?: string
}

export const reportCommand = new Command('report')
  .description('Generate a report from a previous audit JSON output')
  .argument('<json-file>', 'Path to audit JSON file')
  .addOption(
    new Option('-o, --output <format>', 'Output format')
      .choices(['console', 'json', 'sarif'])
      .default('console'),
  )
  .option('--file <path>', 'Write output to file instead of stdout')
  .action((jsonFile: string, options: ReportOptions) => {
    const inputPath = resolve(jsonFile)

    if (!existsSync(inputPath)) {
      console.error(`\n  ${chalk.red('✗')} File not found: ${chalk.bold(jsonFile)}\n`)
      process.exit(1)
    }

    let result: AuditResult
    try {
      result = JSON.parse(readFileSync(inputPath, 'utf-8')) as AuditResult
    } catch {
      console.error(`\n  ${chalk.red('✗')} Failed to parse ${chalk.bold(jsonFile)} — is it a valid audit JSON?\n`)
      process.exit(1)
    }

    if (options.output === 'console') {
      renderHeader()
      console.log()
      renderConsoleReport(result)
      return
    }

    const rendered = options.output === 'sarif'
      ? renderSarifReport(result, ALL_RULES)
      : renderJsonReport(result)

    if (options.file) {
      writeFileSync(resolve(options.file), rendered, 'utf-8')
      console.log(`\n  ${chalk.green('✔')} Report written to ${chalk.bold(options.file)}\n`)
    } else {
      console.log(rendered)
    }
  })
