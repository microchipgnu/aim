import { getModelProvider } from "../../ai/get-model-providers";
import { setBlockResult } from "../../state";
import { replicate } from "../../third-parties/replicate";
import type { RuntimeOptions } from "../../types";
import { getBlockContent, getPreviousBlocksContent } from "../../utils";
import type { Block } from "@aim-sdk/compiler/types";
import { generateObject } from "ai";

export const executeReplicateBlock = async (block: Block, options: RuntimeOptions, previousBlocks: Block[] = []): Promise<string> => {
    const content = getBlockContent(block, options);

    if (options.signal?.aborted) {
        throw new Error("Aborted");
    }

    const previousContent = getPreviousBlocksContent(previousBlocks, options, { maxBlocks: 5 });
    options.onLog(`Previous content: ${previousContent}`);
    const prompt = `${previousContent}\n${content}`.trim();
    options.onLog(`Prompt: ${prompt}`);

    // Get model version ID from attributes or use default
    const model = block.attributes?.model || "435061a1b5a4c1e26740464bf786efdfa9042cb595820f0334e9e54aa75b1a3f";

    let schema;
    let attempts = 0;
    const maxAttempts = Number(block.attributes?.retries) || 3;

    while (attempts < maxAttempts) {
        try {
            schema = await replicate.getModelSchema(model);
            break;
        } catch (error) {
            attempts++;
            options.onLog(`Attempt ${attempts} failed getting schema. Error: ${error}. Retrying...`);
            if (attempts >= maxAttempts) {
                throw new Error(`Failed to get model schema after ${maxAttempts} attempts.`);
            }
        }
    }

    if (!schema) {
        throw new Error("Could not retrieve model schema");
    }

    const inferenceModel = "openai/gpt-4o-mini";
    const modelProvider = getModelProvider(inferenceModel);
    if (!modelProvider) {
        throw new Error(`Invalid model provider for model: ${model}`);
    }
    // Generate input object using AI
    const generatedInput = await generateObject({
        model: modelProvider,
        prompt: `Based on this user request: "${prompt}", generate appropriate input parameters for a Replicate model. The schema is: ${JSON.stringify(schema)}`,
        output: "no-schema",
        abortSignal: options.signal
    });

    // Validate and log the generated input
    if (!generatedInput?.object || typeof generatedInput.object !== 'object') {
        throw new Error('Generated input must be an object');
    }

    options.onLog(`Generated input parameters: ${JSON.stringify(generatedInput.object, null, 2)}`);

    // Validate generated input against schema
    const schemaInput = schema as { input?: { properties?: Record<string, any> } };
    if (schemaInput.input) {
        const requiredFields = Object.entries(schemaInput.input.properties || {})
            .filter(([_, prop]: [string, any]) => prop.required)
            .map(([field]) => field);

        for (const field of requiredFields) {
            if (!(field in generatedInput.object)) {
                throw new Error(`Generated input is missing required field: ${field}`);
            }
        }

        // Check if generated values match schema types
        for (const [field, value] of Object.entries(generatedInput.object)) {
            const fieldSchema = schemaInput.input.properties?.[field];
            if (fieldSchema) {
                const type = fieldSchema.type;
                const actualType = typeof value;
                if (type === 'number' && actualType !== 'number' ||
                    type === 'string' && actualType !== 'string' ||
                    type === 'boolean' && actualType !== 'boolean') {
                    throw new Error(`Invalid type for field ${field}. Expected ${type}, got ${actualType}`);
                }
            }
        }
    }

    // Merge generated input with any explicit attributes from the block
    const input = {
        ...generatedInput.object,
        ...block.attributes,
        prompt // Always include the original prompt
    };

    let output;
    attempts = 0;

    while (attempts < maxAttempts) {
        try {
            output = await replicate.runModelAndWait(model, input);
            break;
        } catch (error) {
            attempts++;
            options.onLog(`Attempt ${attempts} failed running model. Error: ${error}. Retrying...`);
            if (attempts >= maxAttempts) {
                throw new Error(`Failed to run model after ${maxAttempts} attempts.`);
            }
        }
    }

    if (!output) {
        throw new Error("Model execution produced no output");
    }

    options.onLog(`Generation completed. Output: ${output}`);

    const filename = `${block.id}/${Date.now()}.png`;

    options.onOutput && options.onOutput({
        type: 'image',
        content: output.toString(),
        executedBlock: block,
        success: true,
        data: {
            imageUrl: output
        }
    });

    setBlockResult({ block, result: filename });

    return filename;
}
