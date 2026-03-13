import { Command } from 'commander'

export const initCommand = new Command('init')
  .description('Initialize a route-auditor.config.json in your project')
  .argument('[directory]', 'Path to Next.js project root', '.')
  .action(() => {
    console.log('init command — not implemented yet')
  })
