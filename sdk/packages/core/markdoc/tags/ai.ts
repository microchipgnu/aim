import type { Schema } from "@markdoc/markdoc";
import Markdoc, { Tag } from "@markdoc/markdoc";
import { pushStack } from "runtime/state";
import type { AIMTag } from "types";

export const aiTag: Schema = {
    render: 'ai',
    attributes: {
        model: { type: String, required: true, default: 'openai/gpt-4-mini' },
        id: { type: String, required: false }
    }
}

export const aiTagWithRuntime: AIMTag = {
    ...aiTag,
    runtime: async (node, config) => {
        const attrs = node.transformAttributes(config);
        const promptNode = Markdoc.transform(node, config);
        const prompt = Markdoc.renderers.html(promptNode);

        const result = Math.random().toString(36).substring(7);

        pushStack({
            id: attrs.id || 'ai',
            variables: {
                result: result,
            }
        });

        return new Tag('ai', {
            result: result,
            metadata: {
                prompt,
                model: attrs.model
            }
        })
    }
}

