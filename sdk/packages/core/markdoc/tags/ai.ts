import { type Config, type Node, type Schema, Tag } from "@markdoc/markdoc";
import { generateObject, generateText } from "ai";
import { GLOBAL_SCOPE } from "aim";
import { text } from "markdoc/renderers/text";
import { getModelProvider } from "runtime/ai/get-model-providers";
import type { StateManager } from "runtime/state";
import { z } from "zod";

export const aiTag: Schema = {
    render: 'ai',
    selfClosing: true,
    attributes: {
        model: { type: String, required: true, default: 'openai/gpt-4o-mini' },
        id: { type: String, required: false },
        temperature: { type: Number, required: false, default: 0.5 },
        structuredOutputs: { type: Object, required: false, default: undefined },
    },
    transform(node, config) {
        return new Tag("ai", node.transformAttributes(config), node.transformChildren(config));
    }
}

export async function* ai(node: Node, config: Config, stateManager: StateManager) {
    const attrs = node.transformAttributes(config);

    const contextText = stateManager.getScopedText(GLOBAL_SCOPE).join('\n');

    stateManager.runtimeOptions.events?.onLog?.(`Context: ${contextText}`);

    const model = attrs.model || "openai/gpt-4o-mini";
    const modelProvider = getModelProvider(model);

    if (!modelProvider) {
        throw new Error(`Invalid model provider for model: ${model}`);
    }

    const result = await generateText({
        model: modelProvider,
        prompt: contextText,
        temperature: attrs.temperature || 0.5,
    });

    let structuredOutputs;
    if (attrs.structuredOutputs) {
        // Convert Markdoc schema object to Zod schema
        // const zodSchema = z.object(
        //     Object.entries(attrs.structuredOutputs).reduce((schema, [key, value]) => {
        //         if (!value || typeof value !== 'object' || !('type' in value)) {
        //             throw new Error(`Invalid schema format for key ${key}. Expected object with 'type' property.`);
        //         }
                
        //         let zodType: z.ZodType;
                
        //         switch ((value.type as string).toLowerCase()) {
        //             case 'string':
        //                 zodType = z.string();
        //                 break;
        //             case 'number':
        //                 zodType = z.number();
        //                 break;
        //             case 'boolean':
        //                 zodType = z.boolean();
        //                 break;
        //             case 'array':
        //                 zodType = z.array(z.any());
        //                 break;
        //             case 'object':
        //                 zodType = z.record(z.any());
        //                 break;
        //             default:
        //                 zodType = z.any();
        //         }

        //         if ('description' in value && value.description) {
        //             zodType = zodType.describe(value.description as string);
        //         }

        //         schema[key] = zodType;
        //         return schema;
        //     }, {} as Record<string, z.ZodType>)
        // );

        // Example:
        // For structuredOutputs like:
        // {
        //   name: { type: 'string', description: 'The person\'s name' },
        //   age: { type: 'number' },
        //   hobbies: { type: 'array' },
        //   address: { 
        //     type: 'object',
        //     properties: {
        //       street: { type: 'string' },
        //       city: { type: 'string' },
        //       country: { type: 'string' }
        //     }
        //   },
        //   family: {
        //     type: 'array',
        //     items: {
        //       type: 'object',
        //       properties: {
        //         name: { type: 'string' },
        //         relation: { type: 'string' }
        //       }
        //     }
        //   }
        // }
        // 
        // Creates equivalent Zod schema:
        // z.object({
        //   name: z.string().describe('The person\'s name'),
        //   age: z.number(),
        //   hobbies: z.array(z.any()),
        //   address: z.object({
        //     street: z.string(),
        //     city: z.string(),
        //     country: z.string()
        //   }),
        //   family: z.array(z.object({
        //     name: z.string(),
        //     relation: z.string()
        //   }))
        // })
        
        const structuredOutputsRequest = await generateObject({
            model: modelProvider,
            prompt: `Create an object that matches the following schema: ${JSON.stringify(attrs.structuredOutputs)}\n Here is the context: ${contextText}`,
            temperature: attrs.temperature || 0.5,
            output: "no-schema"
        });

        structuredOutputs = structuredOutputsRequest.object;
    }

    let aiTag = new Tag("ai");
    yield aiTag;

    stateManager.pushStack({
        id: attrs.id || 'ai',
        scope: GLOBAL_SCOPE,
        variables: {
            result: result.text,
            context: contextText,
            ...(structuredOutputs && { structuredOutputs })
        }
    });

    stateManager.addToTextRegistry(text(result.text), GLOBAL_SCOPE);

    aiTag.children = [result.text];
}