import type { Schema } from "@markdoc/markdoc";
import Markdoc, { Tag } from "@markdoc/markdoc";
import { pushStack } from "runtime/state";
import type { AIMTag } from "types";
import { generateText } from "ai";
import { getModelProvider } from "runtime/ai/get-model-providers";
import { $textRegistry } from "runtime/state";

export const aiTag: Schema = {
    render: 'ai',
    selfClosing: true,
    attributes: {
        model: { type: String, required: true, default: 'openai/gpt-4-mini' },
        id: { type: String, required: false },
        temperature: { type: Number, required: false, default: 0.5 }
    }
}

export const aiTagWithRuntime: AIMTag = {
    ...aiTag,
    runtime: async (node, config) => {
        const attrs = node.transformAttributes(config);
        const promptNode = Markdoc.transform(node, config);
        const prompt = Markdoc.renderers.html(promptNode);

        // Get accumulated text from registry
        const contextText = $textRegistry.getState().join('\n');
        
        const model = attrs.model || "openai/gpt-4o-mini";
        const modelProvider = getModelProvider(model);

        if (!modelProvider) {
            throw new Error(`Invalid model provider for model: ${model}`);
        }

        const result = await generateText({
            model: modelProvider,
            prompt: contextText ? `Context:\n${contextText}\n\nPrompt:\n${prompt}` : prompt,
            temperature: attrs.temperature || 0.5
        });

        pushStack({
            id: attrs.id || 'ai',
            variables: {
                result: result.text,
                context: contextText // Make context available in variables
            }
        });

        return new Tag('ai', {
            result: result.text,
            metadata: JSON.stringify({
                prompt,
                context: contextText,
                model: attrs.model
            })
        })
    }
}
