import { build } from 'esbuild'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { dirname } from 'node:path'

interface LoadConfigOptions {
    configPath: string
    defaultConfig?: Record<string, unknown>
}

async function loadConfig({ configPath, defaultConfig = {} }: LoadConfigOptions) {
    try {
        const source = await readFile(configPath, 'utf8')
        const resolveDir = dirname(configPath)

        // Determine loader based on file extension
        const ext = configPath.split('.').pop()?.toLowerCase() || ''
        const loader = ext === 'ts' ? 'ts' : 'js'

        // Build with esbuild
        const result = await build({
            stdin: {
                contents: source,
                loader,
                resolveDir,
            },
            write: false,
            platform: 'node',
            format: 'cjs',
            target: 'node16',
            bundle: true,
            external: ['webpack'],
            metafile: true,
        })

        const transpiledCode = result.outputFiles[0].text

        // Create a custom require function for the execution context
        const customRequire = createRequire(import.meta.url)

        // Create module context
        const moduleContext = {
            exports: {},
            require: customRequire,
            __dirname: resolveDir,
            __filename: configPath,
        }

        // Import required modules
        const { TransformStream, ReadableStream, WritableStream, TextEncoderStream, TextDecoderStream } = await import('node:stream/web')
        const { TextEncoder, TextDecoder } = await import('node:util')
        const { URL, URLSearchParams } = await import('node:url')
        const { performance } = await import('node:perf_hooks')
        const crypto = await import('node:crypto')
        const { AbortController, AbortSignal } = await import('abort-controller')

        // Execute in VM with enhanced context
        const vm = await import('node:vm')
        const script = new vm.Script(transpiledCode)
        const context = vm.createContext({
            ...moduleContext,
            module: moduleContext,
            exports: moduleContext.exports,

            // Node.js globals
            process,
            Buffer,
            console,
            global: global,
            globalThis: global,

            // Timing functions
            setTimeout,
            clearTimeout,
            setInterval,
            clearInterval,
            setImmediate,
            clearImmediate,
            queueMicrotask,

            // Web Streams API
            TransformStream,
            ReadableStream,
            WritableStream,
            TextEncoderStream,
            TextDecoderStream,

            // Web APIs
            TextEncoder,
            TextDecoder,
            fetch,
            Request,
            Response,
            Headers,
            URL,
            URLSearchParams,

            // Abort API
            AbortController,
            AbortSignal,

            // Performance API
            performance,

            // Crypto
            crypto,

            // Error types
            Error,
            TypeError,
            SyntaxError,
            ReferenceError,
            RangeError,
            URIError,
            EvalError,

            // Other built-ins
            JSON,
            Math,
            Date,
            RegExp,
            Map,
            Set,
            WeakMap,
            WeakSet,
            Proxy,
            Reflect,
            Symbol,
            ArrayBuffer,
            SharedArrayBuffer,
            DataView,
            Atomics,

            // TypedArrays
            Int8Array,
            Uint8Array,
            Uint8ClampedArray,
            Int16Array,
            Uint16Array,
            Int32Array,
            Uint32Array,
            Float32Array,
            Float64Array,
            BigInt64Array,
            BigUint64Array,

            // Promise
            Promise,
            AsyncFunction: Object.getPrototypeOf((() => async () => {})()).constructor,

            // Intl
            Intl,
        })
        script.runInContext(context)

        // Handle async config
        const loadedConfig = (moduleContext.exports as { default?: unknown }).default || moduleContext.exports
        const config = typeof loadedConfig === 'function'
            ? await loadedConfig()
            : loadedConfig

        // Merge with default config
        return { ...defaultConfig, ...config }

    } catch (error) {
        return defaultConfig
    }
}

export default loadConfig