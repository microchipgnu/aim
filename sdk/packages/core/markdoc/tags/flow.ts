import { Tag, type Config, type Node, type Schema } from "@markdoc/markdoc";
import { aim, GLOBAL_SCOPE, StateManager } from "index";
import { nanoid } from "nanoid";

export const flowTag: Schema = {
    render: 'flow',
    selfClosing: true,
    attributes: {
        path: { type: String, required: true },
        id: { type: String, required: false },
        input: { type: Object, required: false }
    },
    transform(node, config) {
        return new Tag("flow", node.transformAttributes(config), node.transformChildren(config));
    }
}

export async function* flow(node: Node, config: Config, stateManager: StateManager) {
    const runtimeState = stateManager.getRuntimeState();
    const signal = runtimeState.options.signals.abort;

    const attrs = node.transformAttributes(config);

    let flowTag = new Tag("flow");
    yield flowTag;

    // Check abort signal before processing
    if (signal.aborted) {
        throw new Error('Flow execution aborted');
    }

    const path = attrs.path;
    const id = attrs.id || nanoid();
    const input = attrs.input || {};

    if (!path) {
        throw new Error('Flow tag must have a path attribute');
    }

    try {
        // Check abort signal before loading content
        if (signal.aborted) {
            throw new Error('Flow execution aborted');
        }

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

        // Check abort signal before compilation
        if (signal.aborted) {
            throw new Error('Flow execution aborted');
        }

        const { ast, errors, execute } = aim({
            content: flowContent,
            options: {
                settings: {
                    useScoping: true
                },
                config,
                signals: {
                    abort: signal
                }
            }
        });

        if (errors && errors.length > 0) {
            throw new Error(`Flow compilation errors: ${errors.join(", ")}`);
        }

        // Check abort signal before execution
        if (signal.aborted) {
            throw new Error('Flow execution aborted');
        }

        await execute();

        // Check abort signal before finalizing
        if (signal.aborted) {
            throw new Error('Flow execution aborted');
        }

        // Push flow variables to stack
        stateManager.pushStack({
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
