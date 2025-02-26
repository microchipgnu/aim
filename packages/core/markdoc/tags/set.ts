import {
  type Config,
  type Node,
  type RenderableTreeNodes,
  type Schema,
  Tag,
} from '@markdoc/markdoc';
import { GLOBAL_SCOPE } from '../../aim';
import { resolveValue } from '../../markdoc/utils';
import type { StateManager } from '../../runtime/state';

export const setTag: Schema = {
  render: 'set',
  selfClosing: true,
  attributes: {
    id: { type: String, required: true },
  },
  transform(node, config) {
    return new Tag(
      'set',
      node.transformAttributes(config),
      node.transformChildren(config),
    );
  },
};

export async function* set(
  node: Node,
  config: Config,
  stateManager: StateManager,
): AsyncGenerator<RenderableTreeNodes> {
  const runtimeState = stateManager.getRuntimeState();
  const signal = runtimeState.options.signals.abort;

  const attrs = node.transformAttributes(config);

  const id = attrs.id;
  if (!id) {
    throw new Error('Set tag must have an id attribute');
  }

  const setTag = new Tag('set');

  // Check abort signal before processing
  if (signal.aborted) {
    throw new Error('Set execution aborted');
  }

  const variables = Object.fromEntries(
    Object.entries(node.attributes)
      .filter(([key]) => key !== 'id')
      .map(([key, value]) => [key, resolveValue(value, config)]),
  );

  // Check abort signal before pushing state
  if (signal.aborted) {
    throw new Error('Set execution aborted');
  }

  stateManager.pushStack({
    id,
    variables,
    scope: GLOBAL_SCOPE,
  });

  // Check abort signal before finalizing
  if (signal.aborted) {
    throw new Error('Set execution aborted');
  }

  setTag.children = [JSON.stringify(variables)];

  // const children = [];
  // for (const child of node.children) {
  //     for await (const result of walk(child)) {
  //         children.push(result);
  //     }
  // }

  // setTag.children = children.flat();

  yield setTag;
}
