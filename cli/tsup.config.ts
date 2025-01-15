import { defineConfig } from 'tsup'
import { copyFile, mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

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
  // async onSuccess() {
  //   try {
  //     // Create fonts directory in both the root and dist
  //     await mkdir(join(__dirname, 'fonts'), { recursive: true });
  //     await mkdir(join(__dirname, 'dist/fonts'), { recursive: true });
      
  //     // Copy Standard.flf from figlet module to both locations
  //     const fontPath = fileURLToPath(new URL('./node_modules/figlet/fonts/Standard.flf', import.meta.url));
      
  //     // Copy to root fonts directory (for development)
  //     await copyFile(
  //       fontPath,
  //       join(__dirname, 'fonts/Standard.flf')
  //     );
      
  //     // Copy to dist fonts directory (for production)
  //     await copyFile(
  //       fontPath,
  //       join(__dirname, 'dist/fonts/Standard.flf')
  //     );
  //   } catch (error) {
  //     console.error('Error copying fonts:', error);
  //   }
  // },
})