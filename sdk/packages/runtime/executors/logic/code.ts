import { getBlockResult, setBlockResult } from "../../state";
import { runPythonWithManifest } from "../../third-parties/wasmer";
import type { RuntimeOptions } from "../../types";
import { getBlockContent } from "../../utils";
import type { Block } from "@aim-sdk/compiler/types";
import { runQuickJS } from "../../third-parties/quickjs";

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
        const codeWithVariables = typeof content === 'string' ? content.replace(/\$(\w+)/g, (match, varName) => {
            const value = allVariables[varName];
            return value !== undefined ? JSON.stringify(value) : match;
        }) : '';

        let fullCode = '';
        let result: string | object;

        if (block.attributes?.language === 'javascript' || 
            block.attributes?.language === 'js' || 
            block.attributes?.language === 'nodejs' ||
            block.attributes?.language === 'ts' ||
            block.attributes?.language === 'typescript') {
            const variableDeclarations = Object.entries(allVariables)
                .map(([key, value]) => `const ${key} = ${JSON.stringify(value)};`)
                .join('\n');

            fullCode = `${variableDeclarations}\n\n${codeWithVariables}`;

            options.onLog?.(`Variables: ${JSON.stringify(allVariables)}`);
            options.onLog?.(`Code: ${fullCode}`);

            const { evalCode } = await runQuickJS();
            const evalResult = await evalCode(fullCode);

            result = evalResult.ok ? JSON.stringify(evalResult.data) : JSON.stringify(evalResult.error);
        } else {
            const variableDeclarations = Object.entries(allVariables)
                .map(([key, value]) => `${key} = ${JSON.stringify(value)}`)
                .join('\n');

            fullCode = `${variableDeclarations}\n\n${codeWithVariables}`;

            options.onLog?.(`Variables: ${JSON.stringify(allVariables)}`);
            options.onLog?.(`Code: ${fullCode}`);

            result = await runPythonWithManifest(fullCode);
        }

        // Store results in variables
        const varName = block.id;
        options.variables[varName] = result as string | number | object;

        options.onOutput?.({
            type: 'code',
            content: result as string | object,
            executedBlock: block,
            success: true,
            data: {
                code: fullCode,
                output: result
            }
        });

        setBlockResult({ block, result: result as string | number | object });

        return result as string | object;

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        options.onError?.(errorMessage);
        throw error;
    }
}
