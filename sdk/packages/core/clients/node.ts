
import type { RuntimeOptions } from "../types";
import * as readline from "readline";
import Markdoc, {type Node} from "@markdoc/markdoc";
import { process as runtimeProcess } from "../runtime/process"

export const execute = async (ast: Node, options: RuntimeOptions): Promise<string[]> => {
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
        const generator = runtimeProcess(ast, options.config);
        for await (const result of generator) {
            if (result) {
                options.onLog(`Processing result: ${JSON.stringify(result)}`);
                if (typeof result === 'string' || typeof result === 'object') {
                    results.push(result);
                }
            }
        }

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
