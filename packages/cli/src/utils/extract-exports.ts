export const extractExports = (rawContent: string): string[] => {
  const exports: string[] = []

  for (const line of rawContent.split('\n')) {
    const trimmedLine = line.trim()

    if (!trimmedLine.startsWith('export')) continue

    const tokens = trimmedLine.split(' ').filter(Boolean)

    if (tokens[1] === 'default') {
      exports.push('default')
      continue
    }

    const nameIndex = tokens[1] === 'async' ? 3 : 2
    const exportName = tokens[nameIndex]
      ?.replaceAll('(', '')
      .replaceAll(')', '')
      .replaceAll('{', '')
      .replaceAll(':', '')
      .replaceAll('=', '')

    if (exportName) exports.push(exportName)
  }

  return exports
}
