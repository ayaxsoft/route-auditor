export const detect = <T>(deps: Set<string>, map: Record<string, T>): T | undefined => {
  for (const [pkg, value] of Object.entries(map)) {
    if (deps.has(pkg)) return value
  }
  return undefined
}
