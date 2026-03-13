import type { RouterType } from '@route-auditor/shared'
import { extname, dirname, basename } from 'path'

const APP_ROUTE_FILENAMES = new Set(['page', 'route'])

const isRouteGroup = (segment: string): boolean => segment.startsWith('(') && segment.endsWith(')')

const removeRouteGroups = (filePath: string): string =>
  filePath
    .split('/')
    .filter((innerSegment) => !isRouteGroup(innerSegment))
    .join('/')

export const filePathToRoutePath = (
  filePath: string,
  routerType: Exclude<RouterType, 'mixed'>,
): string => {
  const normalizedFilePath = filePath.replaceAll('\\', '/')

  if (routerType === 'app') {
    const fileBasename = basename(normalizedFilePath, extname(normalizedFilePath))
    const isRouteFile = APP_ROUTE_FILENAMES.has(fileBasename)
    const routeSegment = isRouteFile ? dirname(normalizedFilePath) : normalizedFilePath
    const withoutGroups = removeRouteGroups(routeSegment)
    const cleanedRoute = withoutGroups === '.' || withoutGroups === '' ? '' : withoutGroups
    return `/${cleanedRoute}`
  }

  const withoutExtension = normalizedFilePath.slice(0, -extname(normalizedFilePath).length)

  if (withoutExtension === 'index') return '/'
  if (withoutExtension.endsWith('/index')) return `/${withoutExtension.slice(0, -'/index'.length)}`
  return `/${withoutExtension}`
}
