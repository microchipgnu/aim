import type { Block } from "@aim-sdk/compiler/types"
import { executeBlocks } from "executors"
import type { RuntimeOptions } from "types"

export const executeFlowBlock = async (block: Block, options: RuntimeOptions, previousBlocks: Block[] = []): Promise<string | object> => {
    if (options.signal?.aborted) {
        throw new Error("Aborted");
    }

    // Get the flow path from attributes
    const flowPath = block.attributes?.path;
    if (!flowPath) {
        throw new Error("Flow block requires a 'path' attribute");
    }

    // Get any input variables passed as attributes
    const inputVariables = block.attributes?.input || {};

    try {
        // Determine if we're in Node.js or browser environment
        const environment = options.environment
        const isNode = environment === 'node'
        
        let flowContent: string;
        
        if (isNode) {
            // Node.js environment - use filesystem
            const fs = await import('fs/promises');
            flowContent = await fs.readFile(flowPath, 'utf-8');
        } else {
            // Browser environment - use fetch
            const response = await fetch(flowPath);
            if (!response.ok) {
                throw new Error(`Failed to fetch flow from '${flowPath}'`);
            }
            flowContent = await response.text();
        }

        // Compile and execute the imported flow
        const { compile } = await import("@aim-sdk/compiler");
        const { document, errors } = await compile(flowContent);

        if (errors && errors.length > 0) {
            throw new Error(`Flow compilation errors: ${errors.join(", ")}`);
        }

        // Execute the flow with inherited options and merged variables
        return executeBlocks(document.blocks, {
            ...options,
            variables: {
                ...options.variables,
                ...inputVariables
            }
        });

    } catch (error) {
        throw new Error(`Failed to execute flow '${flowPath}'`);
    }
}