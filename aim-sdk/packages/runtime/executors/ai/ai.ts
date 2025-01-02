import { generateText } from "ai";
import { getBlockContent } from "../../utils";
import type { RuntimeOptions } from "../../types";
import { getModelProvider } from "../../ai/get-model-providers";
import type { Block } from "@aim-sdk/compiler/types";
import { getPreviousBlocksContent } from "../../utils";
import { setBlockResult } from "../../state";

export const executeGenerationBlock = async (block: Block, options: RuntimeOptions, previousBlocks: Block[] = []): Promise<string | object> => {
    const content = getBlockContent(block, options);

    if (options.signal?.aborted) {
        throw new Error("Aborted");
    }

    const model = block.attributes?.model || "openai/gpt-4o-mini";

    const previousContent = getPreviousBlocksContent(previousBlocks, options, { maxBlocks: 5 })

    options.onLog(`Previous content: ${previousContent}`);
    const prompt = `${previousContent}\n${content}`.trim();
    options.onLog(`Prompt: ${prompt}`);

    // Determine the model provider based on the specified model
    const modelProvider = getModelProvider(model);

    // Log the selected model provider for debugging
    options.onLog(`Using model provider: ${model}`);

    // Ensure the model provider is valid
    if (!modelProvider) {
        throw new Error(`Invalid model provider for model: ${model}`);
    }

    const result = await generateText({
        model: modelProvider,
        prompt: prompt,
        abortSignal: options.signal,
        temperature: Number(block.attributes?.temperature) || 0.5
    });
    options.onLog(`${result.text}`);

    const varName = block.id;
    options.variables[varName] = result.text;

    options.onOutput && options.onOutput({
        type: 'text',
        content: result.text,
        executedBlock: block,
        success: true,
        data: {
            text: result.text
        }
    })

    setBlockResult({ block, result: result.text });

    return result.text
}  