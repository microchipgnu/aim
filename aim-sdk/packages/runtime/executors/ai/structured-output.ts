import { getModelProvider } from "../../ai/get-model-providers";
import type { Block } from "@aim-sdk/compiler/types";
import { generateObject } from "ai";
import { setBlockResult } from "../../state";
import type { RuntimeOptions } from "../../types";
import { getBlockContent, getPreviousBlocksContent } from "../../utils";

export const executeStructuredOutputBlock = async (block: Block, options: RuntimeOptions, previousBlocks: Block[] = []): Promise<string | object> => {
    const content = getBlockContent(block, options);

    if (options.signal?.aborted) {
        throw new Error("Aborted");
    }

    const model = block.attributes?.model || "openai/gpt-4o-mini";
    const structureString = block.attributes?.structure || "[]";
    const outputStrategy = block.attributes?.output || "no-schema";
    const generationMode = block.attributes?.mode || "json";
    const schemaName = block.attributes?.schemaName;
    const schemaDescription = block.attributes?.schemaDescription;

    const previousContent = getPreviousBlocksContent(previousBlocks, options, { maxBlocks: 5 })

    options.onLog(`Previous content: ${previousContent}`);
    const prompt = `${previousContent}\n${content}`.trim();
    options.onLog(`Prompt: ${prompt}`);

    // Determine the model provider based on the specified model
    const modelProvider = getModelProvider(model);
    if (!modelProvider) {
        throw new Error(`Invalid model provider for model: ${model}`);
    }

    let object;
    let attempts = 0;
    const maxAttempts = Number(block.attributes?.retries) || 3;

    while (attempts < maxAttempts) {
        try {
            const result = await generateObject({
                model: modelProvider,
                prompt: `Input data: ${prompt}. \nGenerate a structured output based on the following schema: ${JSON.stringify(structureString)}. Ensure all fields are filled with appropriate and realistic data.`,
                abortSignal: options.signal,
                output: outputStrategy,
                mode: generationMode,
                ...(schemaName && { schemaName }),
                ...(schemaDescription && { schemaDescription })
            });
            object = result.object;
            break;
        } catch (error) {
            attempts++;
            options.onLog(`Attempt ${attempts} failed. Error: ${error}. Retrying...`);
            if (attempts >= maxAttempts) {
                break;
            }
        }
    }
    if (object === undefined) {
        options.onError(`Failed to generate structured output after ${maxAttempts} attempts.`);
        throw new Error(`Failed to generate structured output after ${maxAttempts} attempts.`)
    }

    const result = JSON.stringify(object);

    setBlockResult({ block, result });

    return result;
}  