import type { AuditConfig, AuditRule } from '../types'
import { Command } from 'commander'
import { resolve, join } from 'path'
import { writeFileSync } from 'fs'
import { ALL_RULES } from '../rules'
import { loadConfig } from '../utils/load-config'
import { renderRulesList } from '../ui/rules-list'
import { promptSelectRules } from '../ui/prompt-select-rules'

const CONFIG_FILENAME = 'route-auditor.config.json'

const saveConfig = (configPath: string, config: AuditConfig): void => {
  writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n', 'utf-8')
}

export const isRuleEnabled = (ruleId: string, config: AuditConfig): boolean =>
  config.rules?.[ruleId] !== false

export const rulesCommand = new Command('rules')
  .description('List and manage audit rules')
  .argument('[directory]', 'Path to Next.js project root', '.')
  .action((directory: string) => {
    const projectRoot = resolve(directory)
    const configPath = join(projectRoot, CONFIG_FILENAME)
    const config = loadConfig(configPath)
    renderRulesList(ALL_RULES, config)
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
      console.log('\n  ! All rules are already disabled.\n')
      return
    }

    const selectedIds = await promptSelectRules(enabledRules, 'Select rules to disable')

    if (selectedIds.length === 0) {
      console.log('\n  No changes made.\n')
      return
    }

    const updatedRules = selectedIds.reduce(
      (accumulated, innerRuleId) => ({ ...accumulated, [innerRuleId]: false }),
      config.rules ?? {},
    )
    saveConfig(configPath, { ...config, rules: updatedRules })

    console.log()
    for (const innerRuleId of selectedIds) {
      console.log(`  ✔ ${innerRuleId} disabled`)
    }
    console.log(`  Changes saved to ${CONFIG_FILENAME}`)
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
      console.log('\n  ! All rules are already enabled.\n')
      return
    }

    const selectedIds = await promptSelectRules(disabledRules, 'Select rules to enable')

    if (selectedIds.length === 0) {
      console.log('\n  No changes made.\n')
      return
    }

    const updatedRules = selectedIds.reduce(
      (accumulated, innerRuleId) => ({ ...accumulated, [innerRuleId]: true }),
      config.rules ?? {},
    )
    saveConfig(configPath, { ...config, rules: updatedRules })

    console.log()
    for (const innerRuleId of selectedIds) {
      console.log(`  ✔ ${innerRuleId} enabled`)
    }
    console.log(`  Changes saved to ${CONFIG_FILENAME}`)
    console.log()
  })
