import { readFileSync } from 'fs'
import { join } from 'path'

export const readPackageJson = (projectRoot: string): Record<string, unknown> => {
  try {
    const raw = readFileSync(join(projectRoot, 'package.json'), 'utf8')
    return JSON.parse(raw)
  } catch (_error) {
    return {}
  }
}
