import type { RouterType, RawRouteFile } from '@route-auditor/shared'
import { glob } from 'glob'
import { join } from 'path'

const PAGES_IGNORE = ['_app.*', '_document.*', '_error.*']

const PATTERNS = {
  app: '{**/page,**/route}.{ts,tsx,js,jsx}',
  pages: '**/*.{ts,tsx,js,jsx}',
}

export const scanRoutesForRouter = async (
  projectRoot: string,
  routerType: RouterType,
): Promise<RawRouteFile[]> => {
  if (routerType === 'app') {
    const routeFiles = await glob(PATTERNS.app, { cwd: join(projectRoot, 'app') })
    return routeFiles.map((filePath) => ({ filePath, routerType: 'app' }))
  }

  if (routerType === 'pages') {
    const routeFiles = await glob(PATTERNS.pages, {
      cwd: join(projectRoot, 'pages'),
      ignore: PAGES_IGNORE,
    })
    return routeFiles.map((filePath) => ({ filePath, routerType: 'pages' }))
  }

  const appRouteFiles = await glob(PATTERNS.app, { cwd: join(projectRoot, 'app') })
  const pagesRouteFiles = await glob(PATTERNS.pages, {
    cwd: join(projectRoot, 'pages'),
    ignore: PAGES_IGNORE,
  })

  return [
    ...appRouteFiles.map((filePath): RawRouteFile => ({ filePath, routerType: 'app' })),
    ...pagesRouteFiles.map((filePath): RawRouteFile => ({ filePath, routerType: 'pages' })),
  ]
}
