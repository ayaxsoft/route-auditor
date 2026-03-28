import chokidar from 'chokidar'
import { join, relative, extname } from 'path'
import { existsSync } from 'fs'
import chalk from 'chalk'

const WATCH_DIRS = ['app', 'src/app', 'pages', 'src/pages']
const WATCH_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'])

const timestamp = (): string => new Date().toLocaleTimeString('en-US', { hour12: false })

const buildWatchPaths = (projectRoot: string, configPath: string | null): string[] => {
  const dirs = WATCH_DIRS.map((dir) => join(projectRoot, dir)).filter(existsSync)
  if (configPath) dirs.push(configPath)
  return dirs
}

export const watchRoutes = (
  projectRoot: string,
  configPath: string | null,
  onChanged: (changedFile: string) => Promise<void>,
): void => {
  const paths = buildWatchPaths(projectRoot, configPath)

  if (paths.length === 0) {
    console.log(chalk.yellow('  ⚠ No route directories found to watch.'))
    return
  }

  let debounceTimer: ReturnType<typeof setTimeout> | null = null

  const watcher = chokidar.watch(paths, { ignoreInitial: true })

  const handleChange = (filePath: string) => {
    if (!WATCH_EXTENSIONS.has(extname(filePath))) return
    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(async () => {
      const rel = relative(projectRoot, filePath)
      console.log()
      console.log(chalk.dim('─'.repeat(60)))
      console.log(`${chalk.dim('Changed:')} ${chalk.bold(rel)}  ${chalk.dim(timestamp())}`)
      console.log(chalk.dim('─'.repeat(60)))
      console.log()
      await onChanged(rel)
    }, 300)
  }

  watcher.on('change', handleChange)
  watcher.on('add', handleChange)
  watcher.on('unlink', handleChange)

  process.on('SIGINT', () => {
    void watcher.close()
    console.log()
    process.exit(0)
  })
}
