import type { RouteFile, RouterType } from '../types'

export async function scanRoutes(_projectRoot: string): Promise<RouteFile[]> {
  throw new Error('Not implemented yet')
}

export async function detectRouterType(_projectRoot: string): Promise<RouterType> {
  throw new Error('Not implemented yet')
}
