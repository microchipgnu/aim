import type { Schema } from "@markdoc/markdoc";
import Markdoc from "@markdoc/markdoc";
import { generateText } from "ai";
import { GLOBAL_SCOPE } from "aim";
import { getModelProvider } from "runtime/ai/get-model-providers";
import { $runtimeState, getScopedText, pushStack } from "runtime/state";
import type { AIMRuntime, AIMTag } from "types";

export const aiTag: Schema = {
    render: 'ai',
    selfClosing: true,
    attributes: {
        model: { type: String, required: true, default: 'openai/gpt-4o-mini' },
        id: { type: String, required: false },
        temperature: { type: Number, required: false, default: 0.5 }
    },
    async transform(node, config) {
        const attrs = node.transformAttributes(config);
    

        const contextText = getScopedText(GLOBAL_SCOPE).join('\n');

        const model = attrs.model || "openai/gpt-4o-mini";
        const modelProvider = getModelProvider(model);

        if (!modelProvider) {
            throw new Error(`Invalid model provider for model: ${model}`);
        }

        // Add a small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));

        const result = await generateText({
            model: modelProvider,
            prompt: contextText,
            temperature: attrs.temperature || 0.5
        });

        pushStack({
            id: attrs.id || 'ai',
            scope: GLOBAL_SCOPE,
            variables: {
                result: result.text,
                context: contextText // Make context available in variables
            }
        });

        $runtimeState.getState().options.events?.onData?.(result.text);

        return result.text
    }
}

export const aiTagWithRuntime: AIMTag = {
    ...aiTag,
    runtime: async ({ node, config, execution }: AIMRuntime) => {
        const attrs = node.transformAttributes(config);
        const promptNode = Markdoc.transform(node, config);
        const prompt = Markdoc.renderers.html(promptNode);

        // Get accumulated text from registry
        const contextText = getScopedText(execution.scope).join('\n');

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
            scope: execution.runtime.options.settings.useScoping ? execution.scope : GLOBAL_SCOPE,
            variables: {
                result: result.text,
                context: contextText // Make context available in variables
            }
        });

        // TODO: Clear registry after AI processing
        // clearTextRegistry({ scope: execution.runtime.options.settings.useScoping ? execution.scope : GLOBAL_SCOPE });

        execution.runtime.options.events?.onData?.(result.text);

        return result.text;
    }
}
