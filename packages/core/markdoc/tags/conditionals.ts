import {
  type Config,
  type Node,
  type RenderableTreeNodes,
  Tag,
  tags,
} from '@markdoc/markdoc';
import { nanoid } from 'nanoid';
import { GLOBAL_SCOPE } from '../../aim';
import { walk } from '../../runtime/process';
import type { StateManager } from '../../runtime/state';

type Condition = { condition: any; children: any[]; type: 'if' | 'else' };

function renderConditions(node: any) {
  const conditions: Condition[] = [
    { condition: node.attributes.primary, children: [], type: 'if' },
  ];
  for (const child of node.children) {
    if (child.type === 'tag' && child.tag === 'else')
      conditions.push({
        condition:
          'primary' in child.attributes ? child.attributes.primary : true,
        children: [],
        type: 'else',
      });
    else conditions[conditions.length - 1].children.push(child);
  }
  return conditions;
}

export const ifTag = {
  ...tags.if,
  transform(node: Node, config: Config) {
    const attrs = node.transformAttributes(config);
    const conditions = renderConditions(node);
    const tags = [];

    for (const { condition, children: conditionChildren, type } of conditions) {
      if (type === 'if') {
        tags.push(
          new Tag(
            'if',
            {
              ...attrs,
              'data-condition': condition,
            },
            conditionChildren.map(
              (child) => child.transform?.(config) || child,
            ),
          ),
        );
      } else {
        tags.push(
          new Tag(
            'else',
            {
              ...attrs,
              'data-condition': condition,
            },
            conditionChildren.map(
              (child) => child.transform?.(config) || child,
            ),
          ),
        );
      }
    }

    return tags;
  },
};
export const elseTag = tags.else;

export async function* if_(
  node: Node,
  config: Config,
  stateManager: StateManager,
): AsyncGenerator<RenderableTreeNodes> {
  const runtimeState = stateManager.getRuntimeState();
  const signal = runtimeState.options.signals.abort;

  const attrs = node.transformAttributes(config);
  const conditions = renderConditions(node);

  const ifTag = new Tag('if');

  // Check abort signal before processing
  if (signal.aborted) {
    throw new Error('If execution aborted');
  }

  const children = [];
  const id = attrs.id || nanoid();

  for (const { condition, children: conditionChildren, type } of conditions) {
    // Check abort signal before evaluating each condition
    if (signal.aborted) {
      throw new Error('If execution aborted');
    }

    const resolvedCondition = condition?.resolve
      ? condition.resolve(config)
      : condition;

    if (resolvedCondition) {
      stateManager.pushStack({
        id,
        scope: GLOBAL_SCOPE,
        variables: {
          condition: resolvedCondition,
          isTrue: true,
          branch: type,
        },
      });

      // Check abort signal before processing children
      if (signal.aborted) {
        throw new Error('If execution aborted');
      }

      for (const child of conditionChildren) {
        for await (const result of walk(child, stateManager)) {
          // Check abort signal during child processing
          if (signal.aborted) {
            throw new Error('If execution aborted');
          }
          children.push(result);
        }
      }

      break;
    }
  }

  // Check abort signal before finalizing
  if (signal.aborted) {
    throw new Error('If execution aborted');
  }

  ifTag.children = children.flat();

  yield ifTag;
}
