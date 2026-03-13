import { join } from 'path'
import { dirExists } from './dir-exists'

const NEXT_CONFIG_FILENAMES = [
  'next.config.js',
  'next.config.ts',
  'next.config.mjs',
  'next.config.cjs',
]

export const isNextjsProject = async (projectRoot: string): Promise<boolean> => {
  const checks = await Promise.all(
    NEXT_CONFIG_FILENAMES.map((innerFilename) => dirExists(join(projectRoot, innerFilename))),
  )
  return checks.some(Boolean)
}
