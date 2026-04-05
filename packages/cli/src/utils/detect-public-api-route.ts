import type { RouteFile } from '../types'

const AUTH_HANDLER_PATH_SEGMENT = '/api/auth/'

const TRPC_PATH_SEGMENT = '/api/trpc/'

const AUTH_HANDLER_CONTENT_SIGNATURES = [
  'NextAuth(',
  'toNextJsHandler(',
  'handlers.GET',
  'handlers.POST',
  'createNextHandler(',
  'auth.handler',
]

const TRPC_CONTENT_SIGNATURES = ['@trpc/server', 'fetchRequestHandler(', 'createNextApiHandler(']

const isAuthHandlerRoute = (routePath: string, rawContent: string): boolean =>
  routePath.includes(AUTH_HANDLER_PATH_SEGMENT) &&
  AUTH_HANDLER_CONTENT_SIGNATURES.some((signature) => rawContent.includes(signature))

const isTrpcHandlerRoute = (routePath: string, rawContent: string): boolean =>
  routePath.includes(TRPC_PATH_SEGMENT) &&
  TRPC_CONTENT_SIGNATURES.some((signature) => rawContent.includes(signature))

export const isPublicApiRoute = (route: RouteFile): boolean =>
  isAuthHandlerRoute(route.routePath, route.rawContent) ||
  isTrpcHandlerRoute(route.routePath, route.rawContent)
