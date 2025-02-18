import { defineConfig } from 'tsup'

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
  ],
  external: [
    'path',
    'fs',
    'readline',
    'process',
    'esbuild'
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