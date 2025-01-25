import * as readline from "node:readline";
import * as jsEnvironment from "browser-or-node";
import { process as runtimeProcess } from "./process";
import type { AIMRuntime } from "../types";

export const execute = async ({ node, stateManager }: AIMRuntime): Promise<void> => {
    const options = stateManager?.getRuntimeState().options;

    options.variables = options.variables || {};

    // Handle Node.js specific setup
    if (jsEnvironment.isNode) {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        rl.close();
    }

    stateManager.runtimeOptions?.events?.onStart?.("Execution started!");
    let results: (string | object)[] = [];

    try {
        const generator = runtimeProcess({ node, stateManager });
        for await (const result of generator) {
            if (result) {
                stateManager.runtimeOptions.events?.onLog?.(`Processing result: ${JSON.stringify(result)}`);
                stateManager.runtimeOptions.events?.onData?.(result);
                if (typeof result === 'string' || typeof result === 'object') {
                    results.push(result);
                }
            }
        }

        stateManager.runtimeOptions.events?.onFinish?.("Execution finished!");
        stateManager.runtimeOptions.events?.onSuccess?.("Execution completed successfully!");
    } catch (error) {
        if (
            (jsEnvironment.isBrowser && error instanceof DOMException && error.name === "AbortError") ||
            (jsEnvironment.isNode && error instanceof Error && error.name === "AbortError")
        ) {
            stateManager.runtimeOptions.events?.onAbort?.("Execution aborted!");
        } else {
            stateManager.runtimeOptions.events?.onError?.(`Execution error: ${error}`);
        }
        throw error;
    }
};
