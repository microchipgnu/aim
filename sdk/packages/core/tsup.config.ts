import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  minify: true,
  outDir: 'dist',
  sourcemap: false, // Disable sourcemaps to reduce bundle size
  splitting: true,
  treeshake: {
    preset: 'recommended',
    moduleSideEffects: false, // Assume modules have no side effects for better tree shaking
  },
  noExternal: [], // Bundle all dependencies
  target: 'es2020', // Target newer JS version for smaller output
  outExtension({ format }) {
    return {
      js: format === 'cjs' ? '.js' : '.mjs',
    }
  },
  esbuildOptions(options) {
    options.assetNames = '[name]'
    options.drop = ['console', 'debugger'] // Remove console.logs and debugger statements
    options.pure = ['console.log'] // Mark console.log calls as pure for removal
    options.legalComments = 'none' // Remove license comments
    
    // Remove mangleProps to prevent mangling of module names
    // options.mangleProps = /^_/
    
    options.minifyIdentifiers = true
    options.minifySyntax = true
    options.minifyWhitespace = true
    
    // Add reserved names that shouldn't be minified
    options.keepNames = true
    options.mangleQuoted = false // Prevent mangling of quoted strings
    
    // Reserve specific identifiers from minification
    options.reserveProps = /^(load-vars|eval-code|aimVariables|evaluate)$/
  },
})