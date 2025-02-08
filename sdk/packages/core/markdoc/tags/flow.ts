import { openai } from "@ai-sdk/openai";
import {
	Tag,
	type Config,
	type Node,
	type Schema,
	type RenderableTreeNodes,
} from "@markdoc/markdoc";
import { generateObject } from "ai";
import { aim, GLOBAL_SCOPE, type StateManager } from "index";
import { nanoid } from "nanoid";

export const flowTag: Schema = {
	render: "flow",
	selfClosing: true,
	attributes: {
		path: { type: String, required: true },
		id: { type: String, required: false },
		input: { type: Object, required: false },
	},
	transform(node, config) {
		return new Tag(
			"flow",
			node.transformAttributes(config),
			node.transformChildren(config),
		);
	},
};

export async function* flow(
	node: Node,
	config: Config,
	stateManager: StateManager,
): AsyncGenerator<RenderableTreeNodes> {
	const runtimeState = stateManager.getRuntimeState();
	const signal = runtimeState.options.signals.abort;

	const attrs = node.transformAttributes(config);

	const flowTag = new Tag("flow");

	// Check abort signal before processing
	if (signal.aborted) {
		throw new Error("Flow execution aborted");
	}

	const path = attrs.path;
	const id = attrs.id || nanoid();

	if (!path) {
		throw new Error("Flow tag must have a path attribute");
	}

	try {
		// Check abort signal before loading content
		if (signal.aborted) {
			throw new Error("Flow execution aborted");
		}

		let flowContent: string;

		// TODO: get flow content from external resources (files, urls, etc)
		// for now we get the content from the runtime options

		flowContent = runtimeState.options.experimental_files?.[path]?.content || "";

		// Check abort signal before compilation
		if (signal.aborted) {
			throw new Error("Flow execution aborted");
		}

		const { executeWithGenerator, frontmatter } = aim({
			content: flowContent,
			options: {
				...runtimeState.options,
			},
		});

		// if (errors && errors.length > 0) {
		// 	throw new Error(`Flow compilation errors: ${errors.join(", ")}`);
		// }

		let input = {};
		if (attrs.input) {
			input = attrs.input;
		} else {
			const contextText = stateManager.getScopedText(GLOBAL_SCOPE).join("\n");
			console.log("contextText", contextText);

			const generatedInput = await generateObject({
				model: openai("gpt-4o-mini"),
				prompt: `Create an object that matches the following schema: ${JSON.stringify(frontmatter?.input)}\n Here is the context: ${contextText}`,
				temperature: attrs.temperature || 0.5,
				output: "no-schema",
				abortSignal: signal,
			});

			input = generatedInput.object || {};
		}

		flowTag.children = [`Called flow (${path}) with input: ${JSON.stringify(input)}`];

		yield flowTag;

		for await (const result of executeWithGenerator({
			input: { ...input },
		})) {
			stateManager.addToTextRegistry(JSON.stringify(result), GLOBAL_SCOPE);
		}

		// Check abort signal before finalizing
		if (signal.aborted) {
			throw new Error("Flow execution aborted");
		}

		// Push flow variables to stack
		stateManager.pushStack({
			id,
			scope: GLOBAL_SCOPE,
			variables: {
				...input,
				path,
				content: flowContent,
			},
		});

	} catch (error) {
		throw new Error(`Failed to execute flow '${path}': ${error}`);
	}
}
