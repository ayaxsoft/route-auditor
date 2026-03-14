import { defineConfig } from 'tsup'
import { readFileSync } from 'fs'

const { version } = JSON.parse(readFileSync('./package.json', 'utf-8')) as { version: string }

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  banner: {
    js: '#!/usr/bin/env node',
  },
  external: ['node:fs', 'node:path', 'node:crypto'],
  define: {
    __PACKAGE_VERSION__: JSON.stringify(version),
  },
})
