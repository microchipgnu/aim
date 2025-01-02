
import type { Block } from "@aim-sdk/compiler/types";
import type { RuntimeOptions } from "../types";
import * as readline from "readline";
import { executeBlocks } from "../executors";


export const execute = async (blocks: Block[], options: RuntimeOptions): Promise<string[]> => {
    options.variables = options.variables || {};
    
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    // for (const inputBlock of inputBlocks) {
    //     const question = inputBlock.props?.name || 'Please provide input:';
    //     const input = await new Promise<string>((resolve) => {
    //         rl.question(`${question}: `, resolve);
    //     });
    //     options.variables[inputBlock.props?.name || 'input'] = input;
    // }

    rl.close();

    console.log(`Variables: ${JSON.stringify(options.variables)}`);

    options.onStart("Execution started!");
    let results: (string | object)[] = [];
    try {
        const executionResults = await executeBlocks(blocks, options);
        results = executionResults.filter((result): result is string | object => 
            typeof result === 'string' || typeof result === 'object');
        options.onFinish("Execution finished!");
        options.onSuccess("Execution completed successfully!");
    } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
            options.onAbort("Execution aborted!");
        } else {
            options.onError(`Execution error: ${error}`);
        }
        throw error;
    }
    return results.map(result => typeof result === 'string' ? result : JSON.stringify(result));
};
