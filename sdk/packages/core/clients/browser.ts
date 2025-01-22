import { process as runtimeProcess } from "../runtime/process";
import type { AIMRuntime } from "../types";

export const execute = async ({ node, config, execution }: AIMRuntime): Promise<void> => {

    const options = execution.runtime?.options || {};
    options.variables = options.variables || {};

    options?.events?.onStart?.("Execution started!");

    let results: (string | object)[] = [];
    try {
        const generator = runtimeProcess({ node, config, execution });
        for await (const result of generator) {
            if (result) {
                options.events?.onLog?.(`Processing result: ${JSON.stringify(result)}`);
                if (typeof result === 'string' || typeof result === 'object') {
                    results.push(result);
                }
            }
        }
        options.events?.onFinish?.("Execution finished!");
        options.events?.onSuccess?.("Execution completed successfully!");
    } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
            options.events?.onAbort?.("Execution aborted!");
        } else {
            options.events?.onError?.(`Execution error: ${error}`);
        }
        throw error;
    }
};
