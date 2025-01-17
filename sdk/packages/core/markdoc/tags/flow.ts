import type { Schema } from "@markdoc/markdoc";
import { Tag } from "@markdoc/markdoc";
import { aim } from "index";
import { parser } from "markdoc/parser";
import { getCurrentConfigFx, pushStack } from "runtime/state";
import type { AIMRuntime, AIMTag } from "types";

export const flowTag: Schema = {
    render: 'flow',
    selfClosing: true,
    attributes: {
        path: { type: String, required: true },
        id: { type: String, required: false },
        input: { type: Object, required: false }
    }
}

export const flowTagWithRuntime: AIMTag = {
    ...flowTag,
    runtime: async ({ node, config, execution }: AIMRuntime) => {
        const attrs = node.transformAttributes(config);
        const context = await execution.runtime.context.methods.getCurrentConfig(config);

        const path = attrs.path?.resolve ? attrs.path.resolve(context) : attrs.path;
        const id = attrs.id;
        const input = attrs.input ? Object.fromEntries(
            Object.entries(attrs.input).map(([key, value]) => [
                key,
                (value as any)?.resolve ? (value as any).resolve(context) : value
            ])
        ) : {};

        if (!path) {
            throw new Error('Flow tag must have a path attribute');
        }

        try {
            // Determine environment and load flow content
            const isNode = typeof window === 'undefined';
            let flowContent: string;

            if (isNode) {
                const fs = await import('fs/promises');
                flowContent = await fs.readFile(path, 'utf-8');
            } else {
                const response = await fetch(path);
                if (!response.ok) {
                    throw new Error(`Failed to fetch flow from '${path}'`);
                }
                flowContent = await response.text();
            }

            const {ast, errors, execute } = aim({content: flowContent, options: {
                config: {
                    ...config,
                }
            }})


            if (errors && errors.length > 0) {
                throw new Error(`Flow compilation errors: ${errors.join(", ")}`);
            }

            await execute();

            // Push flow variables to stack
            pushStack({
                id: id || 'flow',
                variables: {
                    ...input,
                    path,
                    content: flowContent
                }
            });

            return new Tag('flow', {
                path,
                input: JSON.stringify(input),
                document: document
            });

        } catch (error) {
            throw new Error(`Failed to execute flow '${path}': ${error}`);
        }
    }
}
