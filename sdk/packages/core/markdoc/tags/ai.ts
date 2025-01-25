import { type Config, type Node, type Schema, Tag } from "@markdoc/markdoc";
import { generateText } from "ai";
import { GLOBAL_SCOPE } from "aim";
import { text } from "markdoc/renderers/text";
import { getModelProvider } from "runtime/ai/get-model-providers";
import type { StateManager } from "runtime/state";

export const aiTag: Schema = {
    render: 'ai',
    selfClosing: true,
    attributes: {
        model: { type: String, required: true, default: 'openai/gpt-4o-mini' },
        id: { type: String, required: false },
        temperature: { type: Number, required: false, default: 0.5 }
    },
    transform(node, config) {
        return new Tag("ai", node.transformAttributes(config), node.transformChildren(config));
    }
}

export async function* ai(node: Node, config: Config, stateManager: StateManager) {
    const attrs = node.transformAttributes(config);

    const contextText = stateManager.getScopedText(GLOBAL_SCOPE).join('\n');

    stateManager.runtimeOptions.events?.onLog?.(`Context: ${contextText}`);

    const model = attrs.model || "openai/gpt-4o-mini";
    const modelProvider = getModelProvider(model);

    if (!modelProvider) {
        throw new Error(`Invalid model provider for model: ${model}`);
    }

    const result = await generateText({
        model: modelProvider,
        prompt: contextText,
        temperature: attrs.temperature || 0.5
    });

    let aiTag = new Tag("ai");
    yield aiTag;

    stateManager.pushStack({
        id: attrs.id || 'ai',
        scope: GLOBAL_SCOPE,
        variables: {
            result: result.text,
            context: contextText
        }
    });

    stateManager.addToTextRegistry(text(result.text), GLOBAL_SCOPE);

    aiTag.children = [result.text];
}