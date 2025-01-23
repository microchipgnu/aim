import { Tag, type Config, type Node, type Schema } from "@markdoc/markdoc";
import { aim, GLOBAL_SCOPE } from "index";
import { nanoid } from "nanoid";
import { pushStack } from "runtime/state";

export const flowTag: Schema = {
    render: 'flow',
    selfClosing: true,
    attributes: {
        path: { type: String, required: true },
        id: { type: String, required: false },
        input: { type: Object, required: false }
    }
}

export async function* flow(node: Node, config: Config) {
    const attrs = node.transformAttributes(config);

    let flowTag = new Tag("flow");
    yield flowTag;

    const path = attrs.path;
    const id = attrs.id || nanoid();
    const input = attrs.input || {};

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

        const { ast, errors, execute } = aim({
            content: flowContent,
            options: {
                settings: {
                    useScoping: true
                },
                config
            }
        });

        if (errors && errors.length > 0) {
            throw new Error(`Flow compilation errors: ${errors.join(", ")}`);
        }

        await execute();

        // Push flow variables to stack
        pushStack({
            id,
            scope: GLOBAL_SCOPE,
            variables: {
                ...input,
                path,
                content: flowContent
            }
        });

        flowTag.children = [JSON.stringify({
            path,
            input,
            content: flowContent
        })];

    } catch (error) {
        throw new Error(`Failed to execute flow '${path}': ${error}`);
    }
}
