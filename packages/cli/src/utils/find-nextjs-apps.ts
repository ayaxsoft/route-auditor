import { join } from 'path'
import { readdir } from 'fs/promises'
import { dirExists } from './dir-exists'
import { isNextjsProject } from './is-nextjs-project'

const MONOREPO_APP_DIRS = ['apps', 'packages']

export const findNextjsApps = async (projectRoot: string): Promise<string[]> => {
  const foundApps: string[] = []

  for (const monorepoDir of MONOREPO_APP_DIRS) {
    const monorepoPath = join(projectRoot, monorepoDir)
    const exists = await dirExists(monorepoPath)
    if (!exists) continue

    const entries = await readdir(monorepoPath, { withFileTypes: true })
    for (const directoryEntry of entries) {
      if (!directoryEntry.isDirectory()) continue
      const candidatePath = join(monorepoPath, directoryEntry.name)
      const isNextjs = await isNextjsProject(candidatePath)
      if (isNextjs) foundApps.push(candidatePath)
    }
  }

  return foundApps
}
