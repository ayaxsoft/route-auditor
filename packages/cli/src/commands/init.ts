import { Command } from 'commander'
import { resolve, join } from 'path'
import { existsSync, writeFileSync } from 'fs'
import chalk from 'chalk'
import { ALL_RULES } from '../rules'

const CONFIG_FILENAME = 'route-auditor.config.json'

const buildDefaultConfig = () => ({
  severity: 'info',
  rules: Object.fromEntries(ALL_RULES.map((innerRule) => [innerRule.id, true])),
  ignore: [],
})

export const initCommand = new Command('init')
  .description('Create a route-auditor.config.json in your project')
  .argument('[directory]', 'Path to Next.js project root', '.')
  .option('--force', 'Overwrite existing config file')
  .action((directory: string, options: { force?: boolean }) => {
    const projectRoot = resolve(directory)
    const configPath = join(projectRoot, CONFIG_FILENAME)

    if (existsSync(configPath) && !options.force) {
      console.log()
      console.log(`  ${chalk.yellow('!')} ${chalk.bold(CONFIG_FILENAME)} already exists.`)
      console.log(`  ${chalk.dim('Run with --force to overwrite.')}`)
      console.log()
      process.exit(1)
    }

    const config = buildDefaultConfig()
    writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n', 'utf-8')

    console.log()
    console.log(`  ${chalk.green('✔')} Created ${chalk.bold(CONFIG_FILENAME)}`)
    console.log()
    console.log(`  ${chalk.dim(`${ALL_RULES.length} rules enabled — edit the file to customize.`)}`)
    console.log()
  })
