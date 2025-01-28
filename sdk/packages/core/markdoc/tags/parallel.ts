import { type Schema, type Node, type Config, Tag } from "@markdoc/markdoc";
import { StateManager, walk } from "runtime";
import { GLOBAL_SCOPE } from "index";

export const parallelTag: Schema = {
    render: 'parallel',
    attributes: {
        id: { type: String, required: false }
    },
    transform(node, config) {
        return new Tag("parallel", node.transformAttributes(config), node.transformChildren(config));
    }
}

export async function* parallel(node: Node, config: Config, stateManager: StateManager) {
    const attrs = node.transformAttributes(config);
    const id = attrs?.id || 'parallel';

    let parallelTag = new Tag("parallel");
    yield parallelTag;

    // Create an array of promises for each child node
    const childPromises = node.children.map(async (child) => {
        const results = [];
        for await (const result of walk(child, stateManager)) {
            if (Array.isArray(result)) {
                results.push(...result);
            } else {
                results.push(result);
            }
        }
        return results;
    });

    // Execute all children in parallel
    const results = await Promise.all(childPromises);

    // Flatten and add all results to parallel tag children
    parallelTag.children = results.flat();

    stateManager.pushStack({
        id,
        scope: GLOBAL_SCOPE,
        variables: {
            results: results.flat()
        }
    });
}
