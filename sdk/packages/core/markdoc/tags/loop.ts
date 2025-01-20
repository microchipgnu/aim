import { type Schema } from "@markdoc/markdoc";
import { _process } from "runtime";
import { popStack, pushStack } from "runtime/state";
import type { AIMRuntime, AIMTag } from "types";

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
    runtime: async ({ node, config, execution }: AIMRuntime) => {
        if (!execution.executeNode) {
            throw new Error('Loop tag must have executeNode function');
        }

        const context = await execution.runtime.context.methods.getCurrentConfig(config);

        const attrs = node.transformAttributes(context);
        const count = typeof attrs.count === 'number' ? attrs.count : attrs.count?.resolve(context);
        const items = Array.isArray(attrs.items) 
            ? attrs.items.map(item => item?.resolve ? item.resolve(context) : item) 
            : attrs.items?.resolve ? attrs.items.resolve(context) : undefined;
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
                // TODO: Fix this. There's a bug here
                const result = await _process({ node: child, config, execution });

                execution.runtime.options?.events?.onData?.(`DATAAAAA ${id}.${child.tag}.${JSON.stringify(result)}`);
                if (result !== null) {
                    iterationResults.push(result);
                }
            }
            results.push(iterationResults);

            popStack();
        }
        return "loop"
    }
}