import type { RouteFile, RouterType } from '../types'
import { join } from 'path'
import { readFile } from 'fs/promises'
import { dirExists } from '../utils/dir-exists'
import { resolveSourceRoot } from '../utils/resolve-source-root'
import { isNextjsProject } from '../utils/is-nextjs-project'
import { findNextjsApps } from '../utils/find-nextjs-apps'
import type { RawRouteFile } from '@route-auditor/shared'
import { scanRoutesForRouter } from '../utils/scan-routes-for-router'
import { filePathToRoutePath } from '../utils/file-path-to-route-path'
import { extractDynamicSegments } from '../utils/extract-dynamic-segments'
import { extractExports } from '../utils/extract-exports'
import { extractHttpMethods } from '../utils/extract-http-methods'

const buildRouteFile = async (sourceRoot: string, rawFile: RawRouteFile): Promise<RouteFile> => {
  const absolutePath = join(sourceRoot, rawFile.routerType, rawFile.filePath)
  const rawContent = await readFile(absolutePath, 'utf-8')
  const routePath = filePathToRoutePath(rawFile.filePath, rawFile.routerType)
  const segments = extractDynamicSegments(routePath)
  const exports = extractExports(rawContent)
  const methods = extractHttpMethods(exports)
  const isApiRoute =
    rawFile.routerType === 'app'
      ? rawFile.filePath.endsWith('route.ts') || rawFile.filePath.endsWith('route.tsx')
      : routePath.startsWith('/api/')

  return {
    projectRoot: sourceRoot,
    filePath: absolutePath,
    routePath,
    routerType: rawFile.routerType,
    isApiRoute,
    ...segments,
    methods,
    exports,
    rawContent,
  }
}

const scanRoutesForProject = async (projectRoot: string): Promise<RouteFile[]> => {
  const sourceRoot = await resolveSourceRoot(projectRoot)
  const routerType = await detectRouterType(sourceRoot)
  const rawFiles = await scanRoutesForRouter(sourceRoot, routerType)
  return Promise.all(rawFiles.map((rawFile) => buildRouteFile(sourceRoot, rawFile)))
}

export const scanRoutes = async (projectRoot: string): Promise<RouteFile[]> => {
  const isNextjs = await isNextjsProject(projectRoot)

  if (isNextjs) return scanRoutesForProject(projectRoot)

  const nextjsApps = await findNextjsApps(projectRoot)
  if (nextjsApps.length === 0) throw new Error(`No Next.js project found at <${projectRoot}>`)

  const routesPerApp = await Promise.all(
    nextjsApps.map((innerAppRoot) => scanRoutesForProject(innerAppRoot)),
  )
  return routesPerApp.flat()
}

export const detectRouterType = async (projectRoot: string): Promise<RouterType> => {
  const existsAppDir = await dirExists(join(projectRoot, 'app'))
  const existsPagesDir = await dirExists(join(projectRoot, 'pages'))

  if (existsAppDir && existsPagesDir) return 'mixed'
  if (existsAppDir) return 'app'
  if (existsPagesDir) return 'pages'

  throw new Error(`No Next.js project found at <${projectRoot}>`)
}
