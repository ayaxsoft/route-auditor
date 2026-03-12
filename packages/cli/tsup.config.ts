import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  banner: {
    js: '#!/usr/bin/env node',
  },
  external: ['node:fs', 'node:path', 'node:crypto'],
})