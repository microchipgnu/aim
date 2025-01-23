import * as readline from "node:readline";
import * as jsEnvironment from "browser-or-node";
import { process as runtimeProcess } from "./process";
import type { AIMRuntime } from "../types";

export const execute = async ({ node, state }: AIMRuntime): Promise<void> => {
    const options = state?.options || {};
    options.variables = options.variables || {};

    // Handle Node.js specific setup
    if (jsEnvironment.isNode) {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        rl.close();
    }

    options?.events?.onStart?.("Execution started!");
    let results: (string | object)[] = [];

    try {
        const generator = runtimeProcess({ node, state });
        for await (const result of generator) {
            if (result) {
                options.events?.onLog?.(`Processing result: ${JSON.stringify(result)}`);
                options.events?.onData?.(result);
                if (typeof result === 'string' || typeof result === 'object') {
                    results.push(result);
                }
            }
        }

        options.events?.onFinish?.("Execution finished!");
        options.events?.onSuccess?.("Execution completed successfully!");
    } catch (error) {
        if (
            (jsEnvironment.isBrowser && error instanceof DOMException && error.name === "AbortError") ||
            (jsEnvironment.isNode && error instanceof Error && error.name === "AbortError")
        ) {
            options.events?.onAbort?.("Execution aborted!");
        } else {
            options.events?.onError?.(`Execution error: ${error}`);
        }
        throw error;
    }
};
