import { Tag, type Config, type Node, type Schema } from "@markdoc/markdoc";
import { GLOBAL_SCOPE } from "aim";
import { resolveValue } from "markdoc/utils";
import { pushStack } from "runtime/state";

export const setTag: Schema = {
    render: 'set',
    selfClosing: true,
    attributes: {
        id: { type: String, required: true },
    }
}

export async function* set(node: Node, config: Config) {
    const attrs = node.transformAttributes(config);

    const id = attrs.id;
    if (!id) {
        throw new Error('Set tag must have an id attribute');
    }

    let setTag = new Tag("set");
    yield setTag;

    const variables = Object.fromEntries(
        Object.entries(node.attributes)
            .filter(([key]) => key !== 'id')
            .map(([key, value]) => [key, resolveValue(value, config)])
    );

    pushStack({
        id,
        variables,
        scope: GLOBAL_SCOPE
    });


    setTag.children = [JSON.stringify(variables)];


    // const children = [];
    // for (const child of node.children) {
    //     for await (const result of walk(child)) {
    //         children.push(result);
    //     }
    // }

    // setTag.children = children.flat();
}