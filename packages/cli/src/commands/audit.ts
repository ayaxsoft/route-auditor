import { Command } from 'commander'
import { resolve } from 'path'
import { scanRoutes } from '../analyzers/scanner'

export const auditCommand = new Command('audit')
  .description('Audit Next.js routes for security vulnerabilities')
  .argument('[directory]', 'Path to Next.js project root', '.')
  .option('-o, --output <format>', 'Output format: console, json, sarif', 'console')
  .option(
    '-s, --severity <level>',
    'Minimum severity to report: critical, high, medium, low, info',
    'info',
  )
  .option(
    '--fail-on <level>',
    'Exit with code 1 if vulnerabilities of this level or higher are found',
  )
  .option('--file <path>', 'Write output to file instead of stdout')
  .option('--config <path>', 'Path to route-auditor.config.json')
  .action(async (directory: string) => {
    const projectRoot = resolve(directory)
    const routes = await scanRoutes(projectRoot)

    const routesByApp = Map.groupBy(routes, (route) => route.projectRoot)

    console.log(`Found ${routes.length} routes across ${routesByApp.size} app(s)\n`)

    for (const [appRoot, appRoutes] of routesByApp) {
      console.log(`  ${appRoot}`)
      for (const route of appRoutes) {
        console.log(
          `    ${route.routerType.padEnd(6)} ${route.isApiRoute ? '[API] ' : '[page]'} ${route.routePath}`,
        )
      }
      console.log()
    }
  })
