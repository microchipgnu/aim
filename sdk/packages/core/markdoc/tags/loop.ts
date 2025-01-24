import { type Schema, type Node, type Config, Tag } from "@markdoc/markdoc";
import { getCurrentConfigFx, pushStack } from "runtime/state";
import { resolveValue } from "markdoc/utils";
import { walk } from "runtime";
import { GLOBAL_SCOPE } from "index";

export function truthy(value: any) {
    return value !== false && value !== undefined && value !== null;
}

const DEFAULT_ID = 'loop';

export const loopTag: Schema = {
    render: 'loop',
    attributes: {
        count: { type: Number, required: false },
        id: { type: String, required: false },
        items: { type: Array, required: false },
        primary: { type: Object, required: false }
    },
    transform(node, config) {
        return new Tag("loop", node.transformAttributes(config), node.transformChildren(config));
    }
}

export async function* loop(node: Node, config: Config) {
    const attrs = node.transformAttributes(config);

    const count = resolveValue(attrs.count, config);
    const items = resolveValue(attrs.items, config);
    const condition = attrs.primary;

    const id = resolveValue(attrs?.id, config) || DEFAULT_ID;

    // Validate we have exactly one of: items, count, or condition
    const numericCount = typeof count === 'number' ? count : parseInt(count || '0', 10);
    const hasValidCount = typeof numericCount === 'number' && !isNaN(numericCount) && numericCount > 0;
    const hasItems = Array.isArray(items) && items.length > 0;
    const hasCondition = condition !== undefined && condition !== null;


    let loopTag = new Tag("loop");
    yield loopTag;

    const iterables = items || (hasValidCount ? Array.from({ length: numericCount }) : [null]);
    let i = 0;

    // Initialize loop variables and any potential condition variables before first iteration
    pushStack({
        id,
        scope: GLOBAL_SCOPE,
        variables: {
            index: 0,
            count: i + 1,
            isFirst: true,
            isLast: false,
            item: iterables[0]
        }
    });

    do {
        for (const child of node.children) {
            for await (const result of walk(child)) {
                if (Array.isArray(result)) {
                    loopTag.children.push(...result);
                } else {
                    loopTag.children.push(result);
                }
            }
        }

        i++;

        // Break if we've exceeded items/count after first iteration
        if (i >= iterables.length && !hasCondition) {
            break;
        }

        // Update loop variables for next iteration
        pushStack({
            id,
            scope: GLOBAL_SCOPE,
            variables: {
                index: i,
                count: i + 1,
                isFirst: i === 0,
                isLast: hasItems ? i === iterables.length - 1 : false,
                item: iterables[i]
            }
        });

        // For condition-based loops, evaluate condition for next iteration
        if (hasCondition) {
            const currentConfig = await getCurrentConfigFx(config);

            console.log("currentConfig", currentConfig.variables);

            const resolvedCondition = resolveValue(condition, currentConfig);

            if (!truthy(resolvedCondition)) {
                break;
            }
        }
    } while (true);
}
