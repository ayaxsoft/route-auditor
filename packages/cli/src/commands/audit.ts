import { Command } from 'commander'

export const auditCommand = new Command('audit')
  .description('Audit Next.js routes for security vulnerabilities')
  .argument('[directory]', 'Path to Next.js project root', '.')
  .option('-o, --output <format>', 'Output format: console, json, sarif', 'console')
  .option('-s, --severity <level>', 'Minimum severity to report: critical, high, medium, low, info', 'info')
  .option('--fail-on <level>', 'Exit with code 1 if vulnerabilities of this level or higher are found')
  .option('--file <path>', 'Write output to file instead of stdout')
  .option('--config <path>', 'Path to route-auditor.config.json')
  .action(() => {
    console.log('audit command — not implemented yet')
})