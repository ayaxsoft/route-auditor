import { defineConfig } from 'vitest/config'
import { readFileSync } from 'fs'

const { version } = JSON.parse(readFileSync('./package.json', 'utf-8')) as { version: string }

export default defineConfig({
  test: {
    environment: 'node',
  },
  define: {
    __PACKAGE_VERSION__: JSON.stringify(version),
  },
})
