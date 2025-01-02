import type { Block } from "@aim-sdk/compiler/types";
import { executeBlocks } from "../../executors";
import { getBlockResultById, setBlockResult, setVariable } from "../../state";
import type { RuntimeOptions } from "../../types";
import { getBlockContent } from "../../utils";

export const executeLoopBlock = async (block: Block, options: RuntimeOptions, previousBlocks: Block[] = []): Promise<string | object | void | number> => {
    const content = getBlockContent(block, options);
    options.onLog(`Executing loop block: ${content}`);
    options.onLog(`Block attributes: ${JSON.stringify(block.attributes, null, 2)}`);

    if (options.signal?.aborted) {
        throw new Error("Aborted");
    }

    const {
        type = 'count',
        count = 1,
        list = '',
        variable = 'i'
    } = block.attributes || {};

    options.onLog(`Loop type: ${type}, count: ${count}, list: ${list}, variable: ${variable}`);

    // Initialize the loop variable if it doesn't exist
    setBlockResult({ block, result: 0 });
    options.onLog(`Initialized block result to 0`);

    let results: (string | object | void)[] = [];

    if (type === 'count') {
        let i = 1;
        while (true) {
            if (options.signal?.aborted) {
                throw new Error("Aborted");
            }

            // Get current value of count variable at each iteration
            let countValue = Number(count);
            if (typeof count === 'object' && count.type === 'variable') {
                options.onLog(`Getting current count value from variable ${count.name}`);
                const varValue = getBlockResultById(count.location.blockId);
                if (varValue !== undefined) {
                    const numValue = Number(varValue.result);
                    if (!isNaN(numValue)) {
                        countValue = numValue;
                        options.onLog(`Current count value is: ${countValue}`);
                    } else {
                        options.onLog(`Warning: Variable ${count.name} could not be converted to number, using default count of 1`);
                        countValue = 1;
                    }
                } else {
                    options.onLog(`Warning: Variable ${count.name} not found, using default count of 1`);
                    countValue = 1;
                }
            }

            // Check if we should continue the loop
            if (i > countValue) {
                break;
            }

            options.onLog(`Loop iteration ${i} of ${countValue}`);
            setBlockResult({ block, result: i });

            if (block.children && block.children.length > 0) {
                options.onLog(`Executing ${block.children.length} child blocks in iteration ${i}`);
                const iterationResults = await executeBlocks(block.children, options);
                options.onLog(`Child blocks execution completed for iteration ${i}`);
                results = results.concat(iterationResults);
                options.onLog(`Results after iteration ${i}: ${JSON.stringify(results)}`);
            }

            i++;
        }
    } else if (type === 'list') {
        const items = list.split(',').map((item: string) => item.trim());
        options.onLog(`Starting list-based loop with ${items.length} items: ${JSON.stringify(items)}`);

        for (let i = 0; i < items.length; i++) {
            if (options.signal?.aborted) {
                throw new Error("Aborted");
            }

            options.onLog(`Loop iteration ${i + 1} of ${items.length}, processing item: ${items[i]}`);
            setVariable({ name: variable, value: items[i] });
            options.onLog(`Set variable ${variable} to ${items[i]}`);

            if (block.children && block.children.length > 0) {
                options.onLog(`Executing ${block.children.length} child blocks for item ${items[i]}`);
                const iterationResults = await executeBlocks(block.children, options);
                options.onLog(`Child blocks execution completed for item ${items[i]}`);
                results = results.concat(iterationResults);
                options.onLog(`Results after processing item ${items[i]}: ${JSON.stringify(results)}`);
            }
        }
    } else {
        options.onLog(`Unknown loop type: ${type}`);
    }

    options.onLog(`Loop completed with ${results.length} total results`);
    return results;
};
