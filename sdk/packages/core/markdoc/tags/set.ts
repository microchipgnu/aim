import { Tag, type Schema } from "@markdoc/markdoc";
import { GLOBAL_SCOPE } from "aim";
import { pushStack } from "runtime/state";
import type { AIMRuntime, AIMTag } from "types";

export const setTag: Schema = {
    render: 'set',
    selfClosing: true,
    attributes: {
        id: { type: String, required: true },
    }
}

export const setTagWithRuntime: AIMTag = {
    ...setTag,
    runtime: async ({ node, config, execution }: AIMRuntime) => {
        const currentContext = await execution.runtime.context.methods.getCurrentConfig(config);
        const attrs = node.transformAttributes(currentContext);

        const id = attrs.id;
        if (!id) {
            throw new Error('Set tag must have an id attribute');
        }

        // Process all non-id attributes and resolve any values
        const variables = Object.fromEntries(
            Object.entries(node.attributes)
                .filter(([key]) => key !== 'id')
                .map(([key, value]) => [key, resolveValue(value, currentContext)])
        );

        pushStack({
            id,
            variables,
            scope: execution.runtime.options.settings.useScoping ? execution.scope : GLOBAL_SCOPE
        });

        return new Tag('set', { id });
    }
}

// Helper function to recursively resolve values
function resolveValue(value: any, context: any): any {
    // Handle null/undefined
    if (value == null) {
        return value;
    }

    // Handle primitive types
    if (typeof value !== 'object') {
        return value;
    }

    // Handle Markdoc Function type
    if ('$$mdtype' in value && value.$$mdtype === 'Function') {
        return value.resolve(context);
    }

    // Handle Markdoc Variable type
    if ('$$mdtype' in value && value.$$mdtype === 'Variable') {
        const path = value.path;
        let resolvedValue = context.variables;
        for (const segment of path) {
            if (resolvedValue && typeof resolvedValue === 'object') {
                resolvedValue = resolvedValue[segment];
            } else {
                resolvedValue = undefined;
                break;
            }
        }
        return resolvedValue;
    }

    // Handle arrays recursively
    if (Array.isArray(value)) {
        return value.map(item => resolveValue(item, context));
    }

    // Handle objects recursively
    if (typeof value === 'object') {
        return Object.fromEntries(
            Object.entries(value).map(([k, v]) => [k, resolveValue(v, context)])
        );
    }

    return value;
}
