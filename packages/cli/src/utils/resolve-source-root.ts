import { join } from 'path'
import { dirExists } from './dir-exists'

export const resolveSourceRoot = async (projectRoot: string): Promise<string> => {
  const hasSrcApp = await dirExists(join(projectRoot, 'src', 'app'))
  const hasSrcPages = await dirExists(join(projectRoot, 'src', 'pages'))
  return hasSrcApp || hasSrcPages ? join(projectRoot, 'src') : projectRoot
}
