import type { Schema } from "@markdoc/markdoc";
import { Tag } from "@markdoc/markdoc";
import { getCurrentConfigFx, pushStack } from "runtime/state";
import type { AIMRuntime, AIMTag } from "types";

export const inputTag: Schema = {
    render: 'input',
    selfClosing: true,
    attributes: {
        name: { type: String, required: false, default: 'question' },
        description: { type: String, required: false, default: '' },
        type: { type: String, required: false, default: 'text/plain' },
        src: { type: String, required: false }
    }
}

export const inputTagWithRuntime: AIMTag = {
    ...inputTag,
    runtime: async ({ node, config, execution }: AIMRuntime) => {
        const attrs = node.transformAttributes(config);
        const context = await execution.runtime.context.methods.getCurrentConfig(config);

        const name = attrs.name?.resolve ? attrs.name.resolve(context) : attrs.name;
        const description = attrs.description?.resolve ? attrs.description.resolve(context) : attrs.description;
        let type = attrs.type?.resolve ? attrs.type.resolve(context) : attrs.type;
        const src = attrs.src?.resolve ? attrs.src.resolve(context) : attrs.src;

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
        // const inputValue = await config.runtime?.onUserInput?.(JSON.stringify({ 
        //     name, 
        //     description, 
        //     type,
        //     src 
        // }));

        const inputValue = 'test';

        if (inputValue) {
            pushStack({
                id: name,
                variables: {
                    value: inputValue,
                    type,
                    description
                }
            });
        }

        return new Tag('input', {
            name,
            description,
            type,
            src,
            value: inputValue
        });
    }
}
