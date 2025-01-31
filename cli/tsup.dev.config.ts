import { fileURLToPath } from 'node:url'
import { defineConfig } from 'tsup'
import { copyFile, cp, mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { existsSync } from 'node:fs'
import { exec } from 'node:child_process'
import { watch } from 'node:fs'

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
    '@modelcontextprotocol/sdk',
    'openapi-mcp-server',
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
      const uiDir = join(__dirname, 'ui')
      const uiBuildDir = join(uiDir, 'dist')
      const uiDistDir = join(__dirname, 'dist', 'ui')
      const srcDir = join(__dirname, 'server')
      const testFilesDir = join(__dirname, 'test-files')
      
      let serverProcess: any = null;

      // Function to rebuild and restart server
      const rebuildAndStartServer = () => {
        console.log('Rebuilding server...')
        exec('bun run build', async (error) => {
          if (error) {
            console.error('Error building server:', error)
            return
          }

          if (serverProcess) {
            serverProcess.kill()
          }
          serverProcess = exec('bun run ./dist/index.mjs start -d ./test-files --ui')
          console.log('Server rebuilt and restarted')
        })
      }
      
      // Set up file watcher for UI directory
      const uiWatcher = watch(join(uiDir, 'src'), { recursive: true }, async (eventType, filename) => {
        if (filename) {
          console.log(`Detected change in UI files: ${filename}`)
          console.log('Rebuilding UI...')
          
          // Rebuild UI using package.json script
          exec('bun run build', { cwd: uiDir }, async (error) => {
            if (error) {
              console.error('Error building UI:', error)
              return
            }

            try {
              await mkdir(uiDistDir, { recursive: true })
              await cp(uiBuildDir, uiDistDir, { recursive: true, force: true })
              console.log('Successfully rebuilt and copied UI files')
              rebuildAndStartServer()
            } catch (err) {
              console.error('Error copying UI build files:', err)
            }
          })
        }
      })

      // Set up file watcher for src directory
      const srcWatcher = watch(srcDir, { recursive: true }, (eventType, filename) => {
        if (filename) {
          console.log(`Detected change in src files: ${filename}`)
          rebuildAndStartServer()
        }
      })

      // Set up file watcher for test-files directory
      const testFilesWatcher = watch(testFilesDir, { recursive: true }, (eventType, filename) => {
        if (filename) {
          console.log(`Detected change in test files: ${filename}`)
          rebuildAndStartServer()
        }
      })

      // Initial setup
      console.log('Setting up development environment...')
      
      // Install and build UI
      await new Promise((resolve, reject) => {
        exec('bun install && bun run build', { cwd: uiDir }, (error) => {
          if (error) {
            reject(error)
            return
          }
          resolve(null)
        })
      })

      // Copy UI build files
      await mkdir(uiDistDir, { recursive: true })
      await cp(uiBuildDir, uiDistDir, { recursive: true, force: true })
      
      if (!existsSync(join(uiDistDir, 'index.html'))) {
        throw new Error('Failed to copy UI build files')
      }
      
      console.log('Successfully initialized development environment')

      // Start development server
      rebuildAndStartServer()

      // Cleanup
      process.on('SIGINT', () => {
        uiWatcher.close()
        srcWatcher.close()
        testFilesWatcher.close()
        if (serverProcess) {
          serverProcess.kill()
        }
        process.exit()
      })
    } catch (error) {
      console.error('Development setup error:', error)
      if (!process.env.TSUP_WATCH) {
        throw error
      }
    }
  },
})