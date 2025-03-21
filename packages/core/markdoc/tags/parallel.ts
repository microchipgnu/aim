import {
  type Config,
  type Node,
  type RenderableTreeNodes,
  type Schema,
  Tag,
} from '@markdoc/markdoc';
import { GLOBAL_SCOPE } from '../../aim';
import { walk } from '../../runtime/process';
import type { StateManager } from '../../runtime/state';

export const parallelTag: Schema = {
  render: 'parallel',
  attributes: {
    id: { type: String, required: false },
  },
  transform(node, config) {
    return new Tag(
      'parallel',
      node.transformAttributes(config),
      node.transformChildren(config),
    );
  },
};

export async function* parallel(
  node: Node,
  config: Config,
  stateManager: StateManager,
): AsyncGenerator<RenderableTreeNodes> {
  const runtimeState = stateManager.getRuntimeState();
  const signal = runtimeState.options.signals.abort;

  const attrs = node.transformAttributes(config);
  const id = attrs?.id || 'parallel';

  const parallelTag = new Tag('parallel');

  // Check abort signal before processing
  if (signal.aborted) {
    throw new Error('Parallel execution aborted');
  }

  // Create an array of promises for each child node
  const childPromises = node.children.map(async (child) => {
    const results = [];
    for await (const result of walk(child, stateManager)) {
      // Check abort signal during child processing
      if (signal.aborted) {
        throw new Error('Parallel execution aborted');
      }

      if (Array.isArray(result)) {
        results.push(...result);
      } else {
        results.push(result);
      }
    }
    return results;
  });

  // Execute all children in parallel with abort handling
  const results = await Promise.race([
    Promise.all(childPromises),
    new Promise<never>((_, reject) => {
      signal.addEventListener('abort', () =>
        reject(new Error('Parallel execution aborted')),
      );
    }),
  ]);

  // Check abort signal before finalizing
  if (signal.aborted) {
    throw new Error('Parallel execution aborted');
  }

  // Flatten and add all results to parallel tag children
  parallelTag.children = results.flat();

  stateManager.pushStack({
    id,
    scope: GLOBAL_SCOPE,
    variables: {
      results: results.flat(),
    },
  });

  yield parallelTag;
}
