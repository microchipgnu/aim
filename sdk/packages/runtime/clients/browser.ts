import type { Block } from "@aim-sdk/compiler/types";
import type { RuntimeOptions } from "../types";
import { executeBlocks } from "../executors";

export const execute = async (blocks: Block[], options: RuntimeOptions): Promise<string[]> => {
    options.variables = options.variables || {};
    
    options.onStart("Execution started!");

    let results: (string | object)[] = [];
    try {
        const executionResults = await executeBlocks(blocks, options);
        results = executionResults.filter((result): result is string | object => 
            typeof result === 'string' || typeof result === 'object');
        options.onFinish("Execution finished!");
        options.onSuccess("Execution completed successfully!");
    } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
            options.onAbort("Execution aborted!");
        } else {
            options.onError(`Execution error: ${error}`);
        }
        throw error;
    }
    return results.map(result => typeof result === 'string' ? result : JSON.stringify(result));
};
