import { Tag, type Schema } from "@markdoc/markdoc";
import { getCurrentConfigFx, pushStack } from "runtime/state";
import type { AIMTag } from "types";

export const setTag: Schema = {
    render: 'set',
    selfClosing: true,
    attributes: {
        id: { type: String, required: false },
        object: { type: Object, required: false },
        number: { type: Number, required: false },
        string: { type: String, required: false },
        boolean: { type: Boolean, required: false },
        array: { type: Array, required: false },
    }
}

export const setTagWithRuntime: AIMTag = {
    ...setTag,
    runtime: async (node, config) => {
        const attrs = node.transformAttributes(config);

        const context = await getCurrentConfigFx(config);

        const id = attrs.id;
        const object = attrs.object ? Object.fromEntries(
            Object.entries(attrs.object).map(([key, value]) => [
                key,
                (value as any)?.resolve ? (value as any).resolve(context) : value
            ])
        ) : attrs.object;
        const number = attrs.number?.resolve ? attrs.number.resolve(context) : attrs.number;
        const string = attrs.string?.resolve ? attrs.string.resolve(context) : attrs.string;
        const boolean = attrs.boolean?.resolve ? attrs.boolean.resolve(context) : attrs.boolean;
        const array = attrs.array ? attrs.array.map((item: any) => 
            item?.resolve ? item.resolve(context) : item
        ) : attrs.array;


        console.log("SET CONTEXT", object);

        if (!id) {
            throw new Error('Set tag must have an id attribute');
        }

        pushStack({
            id,
            variables: {
                object,
                number,
                string,
                boolean,
                array
            }
        });

        return new Tag('set', attrs);
    }
}
