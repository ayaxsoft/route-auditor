import type { RouteFile, RouterType } from '../types'
import { join } from 'path'
import { dirExists } from '../utils/dir-exists'

export async function scanRoutes(_projectRoot: string): Promise<RouteFile[]> {
  throw new Error('Not implemented yet')
}

export async function detectRouterType(projectRoot: string): Promise<RouterType> {
  const existsAppDir = await dirExists(join(projectRoot, 'app'))
  const existsPagesDir = await dirExists(join(projectRoot, 'pages'))

  if (existsAppDir && existsPagesDir) {
    return 'mixed'
  }

  if (existsAppDir) {
    return 'app'
  }

  if (existsPagesDir) {
    return 'pages'
  }

  throw new Error(`No Next.js project found at <${projectRoot}>`)
}
