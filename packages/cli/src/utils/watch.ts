import chokidar from 'chokidar'
import { join, relative, extname } from 'path'
import { existsSync } from 'fs'

const WATCH_DIRS = ['app', 'src/app', 'pages', 'src/pages']
const WATCH_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'])

const buildWatchPaths = (projectRoot: string, configPath: string | null): string[] => {
  const dirs = WATCH_DIRS.map((dir) => join(projectRoot, dir)).filter(existsSync)
  if (configPath) dirs.push(configPath)
  return dirs
}

export const watchRoutes = (
  projectRoot: string,
  configPath: string | null,
  onChanged: (changedFile: string) => Promise<void>,
): (() => void) => {
  const paths = buildWatchPaths(projectRoot, configPath)

  if (paths.length === 0) {
    return () => undefined
  }

  let debounceTimer: ReturnType<typeof setTimeout> | null = null

  const watcher = chokidar.watch(paths, { ignoreInitial: true })

  const handleChange = (filePath: string) => {
    if (!WATCH_EXTENSIONS.has(extname(filePath))) return
    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => {
      const relativeFilePath = relative(projectRoot, filePath)
      void onChanged(relativeFilePath)
    }, 300)
  }

  watcher.on('change', handleChange)
  watcher.on('add', handleChange)
  watcher.on('unlink', handleChange)

  return () => {
    void watcher.close()
  }
}
