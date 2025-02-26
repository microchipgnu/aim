import {
  type Config,
  type Node,
  type RenderableTreeNodes,
  type Schema,
  Tag,
} from '@markdoc/markdoc';
import { walk } from '../../runtime/process';
import type { StateManager } from '../../runtime/state';

export const groupTag: Schema = {
  render: 'group',
  attributes: {
    id: { type: String, required: false },
  },
  transform(node, config) {
    return new Tag(
      'group',
      node.transformAttributes(config),
      node.transformChildren(config),
    );
  },
};

export async function* group(
  node: Node,
  config: Config,
  stateManager: StateManager,
): AsyncGenerator<RenderableTreeNodes> {
  const groupTag = new Tag('group');

  // Process child nodes
  for (const child of node.children) {
    for await (const result of walk(child, stateManager)) {
      if (Array.isArray(result)) {
        groupTag.children.push(...result);
      } else {
        groupTag.children.push(result);
      }
    }
  }

  yield groupTag;
}
