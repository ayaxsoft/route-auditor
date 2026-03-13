import { access } from 'fs/promises'

export const dirExists = async (path: string): Promise<boolean> => {
  try {
    return access(path)
      .then(() => true)
      .catch(() => false)
  } catch {
    return false
  }
}
