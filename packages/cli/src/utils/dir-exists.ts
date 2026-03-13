import { access } from 'fs/promises'

export async function dirExists(path: string): Promise<boolean> {
  try {
    return access(path)
      .then(() => true)
      .catch(() => false)
  } catch {
    return false
  }
}
