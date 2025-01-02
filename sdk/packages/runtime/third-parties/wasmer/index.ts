import { type PackageManifest } from "@wasmer/sdk";

export const getWasmer = async () => {
    // Check if we're in a browser or Node.js environment
    if (typeof window !== 'undefined') {
        // Browser environment
        const { Wasmer, init } = await import("@wasmer/sdk");
        const workerUrl = new URL("@wasmer/sdk", import.meta.url).toString();
        await init({ workerUrl });
        return Wasmer;
    }

    else {
        // Node.js environment
        const { Wasmer, init } = await import("@wasmer/sdk/node");
        
        await init();
        return Wasmer;
    }
}

export const getModuleAsFile = async (module: string) => {
    let response;
    try {
        response = await fetch(`/wasmer/modules/${module}`);
    } catch (error) {
        console.error("Failed to fetch from /wasmer/modules/. Trying public folder...");
        // try {
        //     const fs = require('fs').promises;
        //     const path = require('path');
        //     const publicPath = path.join(process.cwd(), 'public', 'wasmer', 'modules', module);
        //     const fileContent = await fs.readFile(publicPath);
        //     response = new Response(fileContent);
        // } catch (error) {
        //     throw new Error(`Failed to fetch module: ${error}`);
        // }
    }

    if (!response || !response.ok) {
        throw new Error(`Failed to fetch module: ${response?.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    return uint8Array;
}

export const runPythonWithManifest = async (code: string) => {
    const wasmer = await getWasmer();
    if (!wasmer) throw new Error("Wasmer not found");

    const manifest: PackageManifest = createPythonManifest(code);
    const pkg = await wasmer.createPackage(manifest);
    const instance = await pkg.commands.myCommand.run();
    const { stdout } = await instance.wait();
    return stdout;
}

const createPythonManifest = (code: string): PackageManifest => ({
    command: [{
        module: "wasmer/python:python",
        name: "myCommand",
        runner: "https://webc.org/runner/wasi",
        annotations: {
            wasi: {
                "main-args": ["/app/myapp.py"],
            },
        },
    }],
    dependencies: {
        "wasmer/python": "3.12.5+build.7",
    },
    fs: {
        app: {
            "myapp.py": code,
        },
    },
});

export const runJavaScriptWithManifest = async (code: string) => {
    const wasmer = await getWasmer();
    if (!wasmer) throw new Error("Wasmer not found");

    const manifest: PackageManifest = createJavaScriptManifest(code);
    const pkg = await wasmer.createPackage(manifest);
    const instance = await pkg.commands.script.run();
    const { stdout } = await instance.wait();
    return stdout;
}

const createJavaScriptManifest = (code: string): PackageManifest => {
    const indexJs = `
${code}

async function handler(request) {
  const result = await eval(code);
  const out = JSON.stringify(result);
  return new Response(out, {
    headers: { "content-type": "application/json" },
  });
}

addEventListener("fetch", (fetchEvent) => {
  fetchEvent.respondWith(handler(fetchEvent.request));
});`;

    return {
        command: [{
            module: "wasmer/winterjs:winterjs",
            name: "script",
            runner: "https://webc.org/runner/wasi",
            annotations: {
                wasi: {
                    env: ["JS_PATH=/src/index.js"],
                    "main-args": ["/src/index.js"],
                },
            },
        }],
        dependencies: {
            "wasmer/winterjs": "1.2.0",
        },
        fs: {
            "/src": {
                "index.js": indexJs,
            },
        },
    };
};
