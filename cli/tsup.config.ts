import { existsSync } from 'node:fs'
import { cp } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'tsup'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  entry: ['index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  minify: true,
  outDir: 'dist',
  splitting: false,
  treeshake: {
    preset: 'recommended',
    moduleSideEffects: true,
  },
  noExternal: [
    '@aim-sdk/core',
    'commander',
    'inquirer',
    'dotenv',
    'ora',
    'chalk',
    'openapi-mcp-server',
    '@modelcontextprotocol/sdk',
    '@clerk/express',
    'nanoid'
  ],
  external: [
    'path',
    'fs',
    'readline',
    'process'
  ],
  target: 'node18',
  outExtension({ format }) {
    return {
      js: format === 'cjs' ? '.cjs' : '.mjs'
    }
  },
  banner: {
    js: '#!/usr/bin/env node',
  },
  esbuildOptions(options) {
    options.platform = 'node'
    options.mainFields = ['module', 'main']
  },
})