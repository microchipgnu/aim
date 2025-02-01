import {
	type Config,
	type Node,
	type Schema,
	Tag,
	type RenderableTreeNodes,
} from "@markdoc/markdoc";
import { generateObject, generateText } from "ai";
import { GLOBAL_SCOPE } from "aim";
import { text } from "markdoc/renderers/text";
import type { StateManager } from "runtime/state";
import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createOllama } from "ollama-ai-provider";
import { chromeai as chromeAI } from "chrome-ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";

export const aiTag: Schema = {
	render: "ai",
	selfClosing: true,
	attributes: {
		model: { type: String, required: true, default: "openai/gpt-4o-mini" },
		id: { type: String, required: false },
		temperature: { type: Number, required: false, default: 0.5 },
		structuredOutputs: { type: Object, required: false, default: undefined },
	},
	transform(node, config) {
		return new Tag(
			"ai",
			node.transformAttributes(config),
			node.transformChildren(config),
		);
	},
};

export async function* ai(
	node: Node,
	config: Config,
	stateManager: StateManager,
): AsyncGenerator<RenderableTreeNodes> {
	const runtimeState = stateManager.getRuntimeState();
	const signal = runtimeState.options.signals.abort;

	const attrs = node.transformAttributes(config);

	// Check abort signal before processing
	if (signal.aborted) {
		throw new Error("AI execution aborted");
	}

	const contextText = stateManager.getScopedText(GLOBAL_SCOPE).join("\n");

	const model = attrs.model || "openai/gpt-4o-mini";
	const aiProvider = getModelProvider(model, stateManager);

	if (!aiProvider) {
		throw new Error(`Invalid model provider for model: ${model}`);
	}

	// Check abort signal before text generation
	if (signal.aborted) {
		throw new Error("AI execution aborted");
	}

	const result = await generateText({
		model: aiProvider.modelProvider(aiProvider.modelName),
		prompt: contextText,
		temperature: attrs.temperature || 0.5,
		abortSignal: signal,
	});

	let structuredOutputs;
	if (attrs.structuredOutputs) {
		// Check abort signal before structured outputs generation
		if (signal.aborted) {
			throw new Error("AI execution aborted");
		}

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
			model: aiProvider.modelProvider(aiProvider.modelName),
			prompt: `Create an object that matches the following schema: ${JSON.stringify(attrs.structuredOutputs)}\n Here is the context: ${contextText}`,
			temperature: attrs.temperature || 0.5,
			output: "no-schema",
			abortSignal: signal,
		});

		structuredOutputs = structuredOutputsRequest.object;
	}

	const aiTag = new Tag("ai");

	// Check abort signal before finalizing
	if (signal.aborted) {
		throw new Error("AI execution aborted");
	}

	stateManager.pushStack({
		id: attrs.id || "ai",
		scope: GLOBAL_SCOPE,
		variables: {
			result: result.text,
			context: contextText,
			...(structuredOutputs && { structuredOutputs }),
		},
	});

	stateManager.addToTextRegistry(text(result.text), GLOBAL_SCOPE);
	stateManager.addToTextRegistry(
		text(JSON.stringify(structuredOutputs)),
		GLOBAL_SCOPE,
	);

	aiTag.children.push(result.text);

	yield aiTag;
}

// Implements CAIMPS (https://github.com/microchipgnu/caimps) and maps to providers used by Vercel AI SDK

export const getModelProvider = (
	model: string,
	stateManager: StateManager,
): {
	model: string;
	provider: string;
	modelName: string;
	hosting: string;
	modelProvider: any;
} => {
	const [provider, modelName] = model.split("/");
	const hosting = getModelHosting(model);

	const createProviderConfig = (modelProvider: any) => ({
		model,
		provider,
		modelName,
		hosting,
		modelProvider,
	});

	if (hosting === "openrouter") {
		const openRouterProvider = createOpenRouter({
			apiKey: stateManager.getSecret("OPENROUTER_API_KEY"),
		})(`${provider}/${modelName}`);
		return createProviderConfig(openRouterProvider);
	}

	switch (provider) {
		case "openai": {
			const openAIProvider = createOpenAI({
				apiKey: stateManager.getSecret("OPENAI_API_KEY"),
			});
			return createProviderConfig(openAIProvider);
		}

		case "anthropic": {
			const anthropicProvider = createAnthropic({
				apiKey: stateManager.getSecret("ANTHROPIC_API_KEY"),
			});
			return createProviderConfig(anthropicProvider);
		}

		case "ollama": {
			const ollamaProvider = createOllama({
				baseURL: stateManager.getSecret("OLLAMA_BASE_URL"),
			});
			return createProviderConfig(ollamaProvider);
		}

		case "google": {
			if (modelName === "chrome-ai@chrome") {
				const chromeProvider = chromeAI("text", { temperature: 0.5, topK: 5 });
				return createProviderConfig(chromeProvider);
			}
			throw new Error(`Unknown Google model: ${modelName}`);
		}

		default:
			throw new Error(`Unknown model provider: ${provider}`);
	}
};

export const modelProviders = [
	{
		provider: "openai",
		models: [
			"gpt-3.5-turbo",
			"gpt-4",
			"gpt-4-turbo",
			"gpt-4-32k",
			"gpt-4-1106-preview",
			"gpt-4-vision-preview",
			"gpt-3.5-turbo-16k",
			"gpt-3.5-turbo-instruct",
		],
	},
	{
		provider: "google",
		models: [
			"gemini-pro",
			"gemini-pro-vision",
			"text-bison",
			"chat-bison",
			"code-bison",
			"codechat-bison",
		],
	},
	{
		provider: "anthropic",
		models: [
			"claude-2",
			"claude-2.1",
			"claude-3-opus",
			"claude-3-sonnet",
			"claude-3-haiku",
			"claude-instant-1",
			"claude-instant-1.2",
		],
	},
];

export const allModels = modelProviders.flatMap((provider) =>
	provider.models.map((model) => `${provider.provider}/${model}`),
);

export const getModelName = (fullModelName: string): string => {
	const [, modelName] = fullModelName.split("/");
	return modelName || fullModelName;
};

export const getProviderName = (fullModelName: string): string => {
	const [providerName] = fullModelName.split("/");
	return providerName || "unknown";
};

export const getModelHosting = (fullModelName: string): string => {
	const [provider, modelName] = fullModelName.split("/");
	if (provider === "ollama") return "local";
	if (modelName?.includes("@")) {
		const [, host] = modelName.split("@");
		return host;
	}
	if (modelName?.includes("openrouter")) return "openrouter";
	return "cloud";
};
