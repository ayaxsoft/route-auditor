export const collectDependencies = (pkg: Record<string, unknown>): Set<string> => {
  const dependencies = new Set<string>()
  const sections = ['dependencies', 'devDependencies', 'peerDependencies']

  for (const section of sections) {
    const block = pkg[section]
    if (block && typeof block === 'object') {
      for (const name of Object.keys(block)) {
        dependencies.add(name)
      }
    }
  }

  return dependencies
}
