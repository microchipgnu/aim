import { type Config, type Schema, type Node, Tag } from "@markdoc/markdoc";
import { generateText } from "ai";
import { GLOBAL_SCOPE } from "aim";
import { text } from "markdoc/renderers/text";
import { walk } from "runtime";
import { getModelProvider } from "runtime/ai/get-model-providers";
import { $runtimeState, getScopedText, pushStack } from "runtime/state";

export const aiTag: Schema = {
    render: 'ai',
    selfClosing: true,
    attributes: {
        model: { type: String, required: true, default: 'openai/gpt-4o-mini' },
        id: { type: String, required: false },
        temperature: { type: Number, required: false, default: 0.5 }
    }
}

export async function* ai(node: Node, config: Config) {
    const runtimeState = $runtimeState.getState();
    const attrs = node.transformAttributes(config);

    const contextText = getScopedText(GLOBAL_SCOPE).join('\n');

    runtimeState.options.events?.onLog?.(`Context: ${contextText}`);

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

    pushStack({
        id: attrs.id || 'ai',
        scope: GLOBAL_SCOPE,
        variables: {
            result: result.text,
            context: contextText
        }
    });

    runtimeState.context.methods.addToTextRegistry({ text: text(result.text), scope: GLOBAL_SCOPE });

    // yield result.text;

    aiTag.children = [result.text];

    // const children = [];
    // for (const child of node.children) {
    //     for await (const childResult of walk(child)) {
    //         children.push(childResult);
    //     }
    // }

    

    // aiTag.children = [...children, result.text].flat();
}