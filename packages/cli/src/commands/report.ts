import { Command } from 'commander'

export const reportCommand = new Command('report')
  .description('Generate a report from a previous audit JSON output')
  .argument('<json-file>', 'Path to audit JSON file')
  .action(() => {
    console.log('report command — not implemented yet')
  })
