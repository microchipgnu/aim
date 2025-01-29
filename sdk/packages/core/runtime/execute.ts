import * as readline from "node:readline";
import * as jsEnvironment from "browser-or-node";
import { process as runtimeProcess } from "./process";
import type { AIMRuntime } from "../types";

export const execute = async ({ node, stateManager }: AIMRuntime): Promise<void> => {
    const runtimeState = stateManager.getRuntimeState();
    const signal = runtimeState.options.signals.abort;
    const options = runtimeState.options;

    options.variables = options.variables || {};

    // Check abort signal before setup
    if (signal.aborted) {
        throw new Error('Execution aborted');
    }

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
        // Check abort signal before processing
        if (signal.aborted) {
            throw new Error('Execution aborted');
        }

        const generator = runtimeProcess({ node, stateManager });
        for await (const result of generator) {
            // Check abort signal during processing
            if (signal.aborted) {
                throw new Error('Execution aborted');
            }

            if (result) {
                stateManager.runtimeOptions.events?.onLog?.(`Processing result: ${JSON.stringify(result)}`);
                stateManager.runtimeOptions.events?.onData?.(result);
                if (typeof result === 'string' || typeof result === 'object') {
                    results.push(result);
                }
            }
        }

        // Check abort signal before finishing
        if (signal.aborted) {
            throw new Error('Execution aborted');
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

export async function* executeGenerator({ node, stateManager }: AIMRuntime): AsyncGenerator<string | object> {
    const runtimeState = stateManager.getRuntimeState();
    const signal = runtimeState.options.signals.abort;
    const options = runtimeState.options;

    options.variables = options.variables || {};

    // Check abort signal before setup
    if (signal.aborted) {
        throw new Error('Execution aborted');
    }

    // Handle Node.js specific setup
    if (jsEnvironment.isNode) {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        rl.close();
    }

    stateManager.runtimeOptions?.events?.onStart?.("Execution started!");

    try {
        // Check abort signal before processing
        if (signal.aborted) {
            throw new Error('Execution aborted');
        }

        const generator = runtimeProcess({ node, stateManager });
        for await (const result of generator) {
            // Check abort signal during processing
            if (signal.aborted) {
                throw new Error('Execution aborted');
            }

            if (result) {
                stateManager.runtimeOptions.events?.onLog?.(`Processing result: ${JSON.stringify(result)}`);
                stateManager.runtimeOptions.events?.onData?.(result);
                if (typeof result === 'string' || typeof result === 'object') {
                    yield result;
                }
            }
        }

        // Check abort signal before finishing
        if (signal.aborted) {
            throw new Error('Execution aborted');
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
}
