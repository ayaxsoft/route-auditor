import type { AuditConfig, AuditRule } from '../types'
import { Command } from 'commander'
import { resolve, join } from 'path'
import { writeFileSync } from 'fs'
import chalk from 'chalk'
import { checkbox } from '@inquirer/prompts'
import { ALL_RULES } from '../rules'
import { SEVERITY_COLOR } from '../utils/severity-color'
import { loadConfig } from '../utils/load-config'

const CONFIG_FILENAME = 'route-auditor.config.json'

const saveConfig = (configPath: string, config: AuditConfig): void => {
  writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n', 'utf-8')
}

export const isRuleEnabled = (ruleId: string, config: AuditConfig): boolean =>
  config.rules?.[ruleId] !== false

const buildRuleLabel = (innerRule: AuditRule): string => {
  const severityColor = SEVERITY_COLOR[innerRule.severity] ?? chalk.white
  return `${chalk.dim(innerRule.id.padEnd(16))} ${severityColor(innerRule.severity.padEnd(8))} ${innerRule.name}`
}

export const rulesCommand = new Command('rules')
  .description('List and manage audit rules')
  .argument('[directory]', 'Path to Next.js project root', '.')
  .action((directory: string) => {
    const projectRoot = resolve(directory)
    const configPath = join(projectRoot, CONFIG_FILENAME)
    const config = loadConfig(configPath)

    console.log()
    for (const innerRule of ALL_RULES) {
      const enabled = isRuleEnabled(innerRule.id, config)
      const status = enabled ? chalk.green('✔') : chalk.dim('✗')
      const label = enabled ? buildRuleLabel(innerRule) : chalk.dim(buildRuleLabel(innerRule))
      console.log(`  ${status} ${label}`)
    }
    console.log()
  })

rulesCommand
  .command('disable')
  .description('Interactively select rules to disable')
  .argument('[directory]', 'Path to Next.js project root', '.')
  .action(async (directory: string) => {
    const projectRoot = resolve(directory)
    const configPath = join(projectRoot, CONFIG_FILENAME)
    const config = loadConfig(configPath)

    const enabledRules = ALL_RULES.filter((innerRule) => isRuleEnabled(innerRule.id, config))

    if (enabledRules.length === 0) {
      console.log(`\n  ${chalk.yellow('!')} All rules are already disabled.\n`)
      return
    }

    const selected = await checkbox({
      message: 'Select rules to disable',
      loop: false,
      choices: enabledRules.map((innerRule) => ({
        name: buildRuleLabel(innerRule),
        value: innerRule.id,
      })),
    })

    if (selected.length === 0) {
      console.log(`\n  ${chalk.dim('No changes made.')}\n`)
      return
    }

    const updatedRules = selected.reduce(
      (accumulated, innerRuleId) => ({ ...accumulated, [innerRuleId]: false }),
      config.rules ?? {},
    )
    saveConfig(configPath, { ...config, rules: updatedRules })

    console.log()
    for (const innerRuleId of selected) {
      console.log(`  ${chalk.green('✔')} ${chalk.bold(innerRuleId)} disabled`)
    }
    console.log(`  ${chalk.dim(`Changes saved to ${CONFIG_FILENAME}`)}`)
    console.log()
  })

rulesCommand
  .command('enable')
  .description('Interactively select rules to enable')
  .argument('[directory]', 'Path to Next.js project root', '.')
  .action(async (directory: string) => {
    const projectRoot = resolve(directory)
    const configPath = join(projectRoot, CONFIG_FILENAME)
    const config = loadConfig(configPath)

    const disabledRules = ALL_RULES.filter((innerRule) => !isRuleEnabled(innerRule.id, config))

    if (disabledRules.length === 0) {
      console.log(`\n  ${chalk.yellow('!')} All rules are already enabled.\n`)
      return
    }

    const selected = await checkbox({
      message: 'Select rules to enable',
      loop: false,
      choices: disabledRules.map((innerRule) => ({
        name: buildRuleLabel(innerRule),
        value: innerRule.id,
      })),
    })

    if (selected.length === 0) {
      console.log(`\n  ${chalk.dim('No changes made.')}\n`)
      return
    }

    const updatedRules = selected.reduce(
      (accumulated, innerRuleId) => ({ ...accumulated, [innerRuleId]: true }),
      config.rules ?? {},
    )
    saveConfig(configPath, { ...config, rules: updatedRules })

    console.log()
    for (const innerRuleId of selected) {
      console.log(`  ${chalk.green('✔')} ${chalk.bold(innerRuleId)} enabled`)
    }
    console.log(`  ${chalk.dim(`Changes saved to ${CONFIG_FILENAME}`)}`)
    console.log()
  })
