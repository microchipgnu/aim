import { getBlockResult, setBlockResult } from "../../state";
import { runPythonWithManifest } from "../../third-parties/wasmer";
import type { RuntimeOptions } from "../../types";
import { getBlockContent } from "../../utils";
import type { Block } from "@aim-sdk/compiler/types";

export const executeCodeBlock = async (block: Block, options: RuntimeOptions): Promise<string | object> => {
    const content = getBlockContent(block, options);

    if (options.signal?.aborted) {
        throw new Error("Aborted");
    }

    try {
        // Get variables from content
        const variables: Record<string, any> = {};
        if (Array.isArray(content)) {
            for (const item of content) {
                if (typeof item === 'object' && item.type === 'variable' && item.location) {
                    const result = getBlockResult({
                        id: item.location.blockId,
                        type: item.location.blockType,
                        children: [] // Add required children property
                    });
                    if (result) {
                        variables[item.name] = result.result;
                    }
                }
            }
        }

        // Combine with runtime variables
        const allVariables = {
            ...variables,
            ...options.variables
        };

        // Replace variables in code
        const codeWithVariables = content.replace(/\$(\w+)/g, (match, varName) => {
            const value = allVariables[varName];
            return value !== undefined ? JSON.stringify(value) : match;
        });

        // Add variable declarations at the start of code
        const variableDeclarations = Object.entries(allVariables)
            .map(([key, value]) => `${key} = ${JSON.stringify(value)}`)
            .join('\n');

        const fullCode = `${variableDeclarations}\n\n${codeWithVariables}`;

        options.onLog(`Variables: ${JSON.stringify(allVariables)}`);
        options.onLog(`Code: ${fullCode}`);

        const result = await runPythonWithManifest(fullCode);

        // Store results in variables
        const varName = block.id;
        options.variables[varName] = result;

        options.onOutput && options.onOutput({
            type: 'code',
            content: result,
            executedBlock: block,
            success: true,
            data: {
                code: fullCode,
                output: result
            }
        });

        setBlockResult({ block, result: result });

        return result;

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        options.onError && options.onError(errorMessage);
        throw error;
    }
}
