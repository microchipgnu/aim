import { type RenderableTreeNodes, type Schema } from "@markdoc/markdoc";
import { nanoid } from "nanoid";
import { executeNode } from "runtime/process";
import { clearTextRegistry, popStack, pushStack } from "runtime/state";
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
    runtime: async ({ node, config, execution }: AIMRuntime): Promise<RenderableTreeNodes> => {
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

        if (!items && !count) {
            throw new Error('Loop tag must have either items or count attribute');
        }

        const iterables = items || Array.from({ length: count });
        const iterations = iterables.length;
        const loopScope = execution.scope;

        for (let i = 0; i < iterations; i++) {
            const scope = nanoid();
            // Clear previous iteration's frame if it exists 
            // popStack({ scope: loopScope });

            // Push new frame for this iteration
            pushStack({
                id,
                scope: scope,
                variables: {
                    index: i + 1,
                    total: iterations,
                    isFirst: i === 0,
                    isLast: i === iterations - 1,
                    item: iterables[i]
                }
            });

            for (const child of node.children) {
                const result = await executeNode({
                    node: child,
                    config,
                    execution: {
                        ...execution,
                        scope: scope
                    }
                });
                console.log("RESULT", result)
            }

            console.log("popping", scope)

            popStack({ scope: scope });
            clearTextRegistry({ scope: scope });
        }

        // Clean up the last iteration's frame
        popStack({ scope: loopScope });
        clearTextRegistry({ scope: loopScope });
        return "";
    }
}