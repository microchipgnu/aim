import { fileURLToPath } from 'node:url'
import { defineConfig } from 'tsup'
import { copyFile, cp, mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { existsSync } from 'node:fs'

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
    '@aim-sdk/server',
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
  async onSuccess() {
    try {
      // Copy UI build files from ui/dist to dist/ui
      const uiBuildDir = join(__dirname, 'ui', 'dist')
      const uiDistDir = join(__dirname, 'dist', 'ui')
      
      // Debug logging
      console.log('Current directory:', __dirname)
      console.log('UI build directory:', uiBuildDir)
      console.log('UI dist directory:', uiDistDir)
      
      if (!existsSync(uiBuildDir)) {
        console.error('UI build directory does not exist:', uiBuildDir)
        return
      }
      
      await cp(uiBuildDir, uiDistDir, { recursive: true, force: true })
      
      // Verify the copy
      if (!existsSync(join(uiDistDir, 'index.html'))) {
        console.error('Failed to copy index.html to:', uiDistDir)
        return
      }
      
      console.log('Successfully copied UI build files to dist/ui')
    } catch (error) {
      console.error('Error copying UI build files:', error)
      if (!process.env.TSUP_WATCH) {
        throw error
      }
    }
  },
})