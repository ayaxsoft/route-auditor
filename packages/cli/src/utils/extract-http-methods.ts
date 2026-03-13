import type { HttpMethod } from '@route-auditor/shared'

const HTTP_METHODS = new Set<string>(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'])

export const extractHttpMethods = (exports: string[]): HttpMethod[] =>
  exports.filter((exportName): exportName is HttpMethod => HTTP_METHODS.has(exportName))
