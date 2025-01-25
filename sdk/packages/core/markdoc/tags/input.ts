import { Tag, type Config, type Node, type Schema } from "@markdoc/markdoc";
import { GLOBAL_SCOPE } from "aim";
import { resolveValue } from "markdoc/utils";
import type { StateManager } from "runtime/state";

export const inputTag: Schema = {
    render: 'input',
    selfClosing: true,
    attributes: {
        name: { type: String, required: false, default: 'question' },
        description: { type: String, required: false, default: '' },
        type: { type: String, required: false, default: 'text/plain' },
        src: { type: String, required: false }
    },
    transform(node, config) {
        return new Tag("input", node.transformAttributes(config), node.transformChildren(config));
    }
}

export async function* input(node: Node, config: Config, stateManager: StateManager) {
    const attrs = node.transformAttributes(config);

    let inputTag = new Tag("input");
    yield inputTag;

    const name = resolveValue(attrs.name, config);
    const description = resolveValue(attrs.description, config);
    let type = resolveValue(attrs.type, config);
    const src = resolveValue(attrs.src, config);

    // Validate src if provided
    if (src && !src.startsWith("file://") && !src.startsWith("http://") && !src.startsWith("https://")) {
        throw new Error("Source must start with file://, http://, or https://");
    }

    // Determine type from src extension if provided
    if (src) {
        const fileExtension = src.split('.').pop()?.toLowerCase();
        switch(fileExtension) {
            case 'json':
                type = 'application/json';
                break;
            case 'txt':
                type = 'text/plain';
                break;
            case 'csv':
                type = 'text/csv';
                break;
            case 'pdf':
                type = 'application/pdf';
                break;
            case 'jpg':
            case 'jpeg':
                type = 'image/jpeg';
                break;
            case 'png':
                type = 'image/png';
                break;
        }
    }

    // TODO: Handle user input
    const inputValue = 'test';

    if (inputValue) {
        stateManager.pushStack({
            id: name,
            scope: GLOBAL_SCOPE,
            variables: {
                value: inputValue,
                type,
                description
            }
        });
    }

    inputTag.children = [JSON.stringify({
        name,
        description,
        type,
        src,
        value: inputValue
    })];
}
