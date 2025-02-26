import { openai } from '@ai-sdk/openai';
import {
  type Config,
  type Node,
  type RenderableTreeNodes,
  type Schema,
  Tag,
} from '@markdoc/markdoc';
import { generateObject } from 'ai';
import { nanoid } from 'nanoid';
import { GLOBAL_SCOPE, aim } from '../../aim';
import type { StateManager } from '../../runtime/state';

export const flowTag: Schema = {
  render: 'flow',
  selfClosing: true,
  attributes: {
    path: { type: String, required: true },
    id: { type: String, required: false },
    input: { type: Object, required: false },
  },
  transform(node, config) {
    return new Tag(
      'flow',
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
  const flowTag = new Tag('flow');

  if (signal.aborted) {
    throw new Error('Flow execution aborted');
  }

  const path = attrs.path;
  const id = attrs.id || nanoid();

  if (!path) {
    throw new Error('Flow tag must have a path attribute');
  }

  try {
    if (signal.aborted) {
      throw new Error('Flow execution aborted');
    }

    // TODO: get flow content from external resources (files, urls, etc)
    // for now we get the content from the runtime options
    const flowContent =
      runtimeState.options.experimental_files?.[path]?.content || '';

    if (signal.aborted) {
      throw new Error('Flow execution aborted');
    }

    const { executeWithGenerator, frontmatter } = aim({
      content: flowContent,
      options: {
        ...runtimeState.options,
      },
      manager: stateManager,
    });

    // if (errors && errors.length > 0) {
    // 	throw new Error(`Flow compilation errors: ${errors.join(", ")}`);
    // }

    let input = {};
    if (attrs.input) {
      input = attrs.input;
    } else if (frontmatter?.input) {
      const contextText = stateManager.getScopedText(GLOBAL_SCOPE).join('\n');

      const generatedInput = await generateObject({
        model: openai('gpt-4o-mini'),
        prompt: `Create an object that matches the following schema: ${JSON.stringify(frontmatter.input)}\n Here is the context: ${contextText}`,
        temperature: attrs.temperature || 0.5,
        output: 'no-schema',
        abortSignal: signal,
      });

      input = generatedInput.object || {};
    }

    flowTag.children = [
      `Called flow (${path}) with input: ${JSON.stringify(input)}`,
    ];

    yield flowTag;

    for await (const result of executeWithGenerator({
      input: { ...input },
    })) {
      yield result as RenderableTreeNodes;
    }

    if (signal.aborted) {
      throw new Error('Flow execution aborted');
    }

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
