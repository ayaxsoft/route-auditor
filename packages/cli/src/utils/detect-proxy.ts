import { existsSync, readFileSync } from 'fs'
import { dirname, join } from 'path'

const LAYOUT_AUTH_SIGNATURES = [
  'getToken',
  'getServerSession',
  'auth(',
  'currentUser',
  'validateRequest',
  'auth.api',
  'supabase.auth',
  'withAuth',
  'requireAuth',
  'isAuthenticated',
  'session',
  'token',
  'redirect',
]

const LAYOUT_FILE_CANDIDATES = ['layout.tsx', 'layout.ts', 'layout.jsx', 'layout.js']

const hasAuthLogic = (fileContent: string): boolean =>
  LAYOUT_AUTH_SIGNATURES.some((signature) => fileContent.includes(signature))

const findLayoutFile = (directory: string): string | null => {
  for (const layoutFileName of LAYOUT_FILE_CANDIDATES) {
    const layoutFilePath = join(directory, layoutFileName)
    if (existsSync(layoutFilePath)) return layoutFilePath
  }
  return null
}

const readFileSafely = (filePath: string): string | null => {
  try {
    return readFileSync(filePath, 'utf8')
  } catch {
    return null
  }
}

export const isRouteProtectedByLayout = (routeFilePath: string, projectRoot: string): boolean => {
  let currentDirectory = dirname(routeFilePath)

  while (currentDirectory.startsWith(projectRoot) && currentDirectory !== projectRoot) {
    const layoutFilePath = findLayoutFile(currentDirectory)

    if (layoutFilePath) {
      const fileContent = readFileSafely(layoutFilePath)
      if (fileContent && hasAuthLogic(fileContent)) return true
    }

    const parentDirectory = dirname(currentDirectory)
    if (parentDirectory === currentDirectory) break
    currentDirectory = parentDirectory
  }

  return false
}
