import { Tag, type RenderableTreeNodes, type Schema } from "@markdoc/markdoc";
import { GLOBAL_SCOPE } from "aim";
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

        const currentConfig = await execution.runtime.context.methods.getCurrentConfig(config);

        const attrs = node.transformAttributes(currentConfig);

        const count = typeof attrs.count === 'number' ? attrs.count : parseInt(attrs.count?.resolve(currentConfig) || '0');
        const items = Array.isArray(attrs.items)
            ? attrs.items.map(item => item?.resolve ? item.resolve(currentConfig) : item)
            : attrs.items?.resolve ? attrs.items.resolve(currentConfig) : undefined;
        const id = attrs.id || 'loop';

        if (!items && typeof count !== 'number') {
            throw new Error('Loop tag must have either items array or count number attribute');
        }

        const iterables = items || Array.from({ length: count });
        const iterations = iterables.length;
        const loopScope = execution.runtime.options.settings.useScoping ? execution.scope : GLOBAL_SCOPE;

        execution.runtime.options.events?.onData?.(new Tag('loop', { id: id }, [new Tag("h1", {}, ["Loop"])]))
        
        for (let i = 0; i < iterations; i++) {
            const scope = execution.runtime.options.settings.useScoping ? nanoid() : GLOBAL_SCOPE;
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
                    config: currentConfig,
                    execution: {
                        ...execution,
                        scope: scope
                    }
                });
                // Wait for result before continuing
                await Promise.resolve(result);
            }

            if (execution.runtime.options.settings.useScoping) {
                popStack({ scope: scope });
                clearTextRegistry({ scope: scope });
            }
        }

        // Clean up the last iteration's frame
        if (execution.runtime.options.settings.useScoping) {
            popStack({ scope: loopScope });
            clearTextRegistry({ scope: loopScope });
        }

        // execution.runtime.options.events?.onData?.("end loop")

        return new Tag('loop');
    }
}
