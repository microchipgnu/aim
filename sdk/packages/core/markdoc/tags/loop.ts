import { type Schema, type Node, type Config, Tag } from "@markdoc/markdoc";
import { pushStack } from "runtime/state";
import { resolveValue } from "markdoc/utils";
import { $runtimeState, walk } from "runtime";
import { GLOBAL_SCOPE } from "index";

const DEFAULT_ID = 'loop';

export const loopTag: Schema = {
    render: 'loop',
    attributes: {
        count: { type: Number, required: false },
        id: { type: String, required: false },
        items: { type: Array, required: false }
    },
    // transform: async(node, config) => {
    //     const runtimeState = $runtimeState.getState();

    //     const attrs = node.transformAttributes(config);
    //     const count = resolveValue(attrs.count, config);
    //     const numericCount = typeof count === 'number' ? count : parseInt(count || '0', 10);

    //     // Parse items attribute using resolveValue
    //     const items = resolveValue(attrs.items, config);

    //     const id = attrs.id || DEFAULT_ID;

    //     if (!items && typeof numericCount !== 'number') {
    //         throw new Error('Loop tag must have either items array or count number attribute');
    //     }

    //     const iterables = items || Array.from({ length: numericCount });
    //     const iterations = iterables.length;
    //     const loopScope = runtimeState.options.settings.useScoping ? GLOBAL_SCOPE : GLOBAL_SCOPE;

    //     for (let i = 0; i < iterations; i++) {
    //         const scope = runtimeState.options.settings.useScoping ? nanoid() : GLOBAL_SCOPE;

    //         pushStack({
    //             id,
    //             scope: scope,
    //             variables: {
    //                 index: i + 1,
    //                 total: iterations,
    //                 isFirst: i === 0,
    //                 isLast: i === iterations - 1,
    //                 item: iterables[i]
    //             }
    //         });

    //         for (const child of node.children) {
    //             await walk(child);
    //         }

    //         if (runtimeState.options.settings.useScoping) {
    //             popStack({ scope: scope });
    //             clearTextRegistry({ scope: scope });
    //         }
    //     }

    //     if (runtimeState.options.settings.useScoping) {
    //         popStack({ scope: loopScope });
    //         clearTextRegistry({ scope: loopScope });
    //     }

    //     return new Tag('loop', { id: id }, [new Tag("h1", {}, ["Loop"])]);
    // },
}

export async function* loop(node: Node, config: Config) {
    const runtimeState = $runtimeState.getState();
    const attrs = node.transformAttributes(config);

    runtimeState.options.events?.onData?.(attrs);

    const count = resolveValue(attrs.count, config);
    const numericCount = typeof count === 'number' ? count : parseInt(count || '0', 10);
    const items = resolveValue(attrs.items, config);

    const id = attrs?.id;

    if (!items && typeof numericCount !== 'number') {
        throw new Error('Loop tag must have either items array or count number attribute');
    }

    let loopTag = new Tag("loop");
    yield loopTag;

    const iterables = items || Array.from({ length: numericCount });
    const iterations = iterables.length;
    const children = [];

    for (let i = 0; i < iterations; i++) {
        pushStack({
            id,
            scope: GLOBAL_SCOPE,
            variables: {
                index: i + 1,
                total: iterations,
                isFirst: i === 0,
                isLast: i === iterations - 1,
                item: iterables[i]
            }
        });

        for (const child of node.children) {
            for await (const result of walk(child)) {
                children.push(result);
            }
        }
    }

    loopTag.children = children.flat().map(child => new Tag("div", {}, [child]));
}
