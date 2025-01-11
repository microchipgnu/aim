import type { Schema } from "@markdoc/markdoc";
import { getCurrentConfigFx, popStack, pushStack } from "runtime/state";
import type { AIMTag } from "types";

export const loopTag: Schema = {
    render: 'loop',
    attributes: {
        count: { type: Number, required: false },
        id: { type: String, required: false },
        items: { type: Array, required: false }
    },
}

export const loopTagWithRuntime: AIMTag = {
    ...loopTag,
    runtime: async (node, config, { executeNode }) => {

        if (!executeNode) {
            throw new Error('Loop tag must have executeNode function');
        }

        const context = await getCurrentConfigFx(config);

        const attrs = node.transformAttributes(context);
        const count = attrs.count;
        const items = attrs.items;
        const id = attrs.id || 'loop';
        const results = [];

        if (!items && !count) {
            throw new Error('Loop tag must have either items or count attribute');
        }

        const iterables = items || Array.from({ length: count });
        const iterations = iterables.length;

        for (let i = 0; i < iterations; i++) {
            pushStack({
                id,
                variables: {
                    index: i + 1,
                    total: iterations,
                    isFirst: i === 0,
                    isLast: i === iterations - 1,
                    item: iterables[i]
                }
            });

            const iterationResults = [];
            for (const child of node.children) {
                const result = await executeNode(child);
                if (result !== null) {
                    iterationResults.push(result);
                }
            }
            results.push(iterationResults);

            popStack();
        }
        return results;
    }
}