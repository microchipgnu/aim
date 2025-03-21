import {
  type Config,
  type Node,
  type RenderableTreeNodes,
  type Schema,
  Tag,
} from '@markdoc/markdoc';
import { GLOBAL_SCOPE } from '../../aim';
import { resolveValue } from '../../markdoc/utils';
import { walk } from '../../runtime/process';
import type { StateManager } from '../../runtime/state';

export function truthy(value: any) {
  return value !== false && value !== undefined && value !== null;
}

const DEFAULT_ID = 'loop';

export const loopTag: Schema = {
  render: 'loop',
  attributes: {
    count: { type: Number, required: false },
    id: { type: String, required: false },
    items: { type: Array, required: false },
    primary: { type: Object, required: false },
  },
  transform(node, config) {
    return new Tag(
      'loop',
      node.transformAttributes(config),
      node.transformChildren(config),
    );
  },
};

export async function* loop(
  node: Node,
  config: Config,
  stateManager: StateManager,
): AsyncGenerator<RenderableTreeNodes> {
  const runtimeState = stateManager.getRuntimeState();
  const signal = runtimeState.options.signals.abort;

  const attrs = node.transformAttributes(config);

  const count = resolveValue(attrs.count, config);
  const items = resolveValue(attrs.items, config);
  const condition = attrs.primary;

  const id = resolveValue(attrs?.id, config) || DEFAULT_ID;

  // Validate we have exactly one of: items, count, or condition
  const numericCount =
    typeof count === 'number' ? count : Number.parseInt(count || '0', 10);
  const hasValidCount =
    typeof numericCount === 'number' &&
    !Number.isNaN(numericCount) &&
    numericCount > 0;
  const hasItems = Array.isArray(items) && items.length > 0;
  const hasCondition = condition !== undefined && condition !== null;

  // Validate that only one loop type is specified
  const loopTypes = [hasValidCount, hasItems, hasCondition].filter(
    Boolean,
  ).length;
  if (loopTypes === 0) {
    throw new Error('Loop must specify either count, items, or a condition');
  }
  if (loopTypes > 1) {
    throw new Error(
      'Loop cannot specify multiple of: count, items, or condition',
    );
  }

  const iterables =
    items || (hasValidCount ? Array.from({ length: numericCount }) : [null]);
  let i = 0;

  // Initialize loop state before first iteration
  const updateLoopState = () => {
    stateManager.pushStack({
      id,
      scope: GLOBAL_SCOPE,
      variables: {
        index: i,
        count: i + 1,
        isFirst: i === 0,
        isLast: hasItems ? i === iterables.length - 1 : i === numericCount - 1,
        item: hasItems ? iterables[i] : undefined,
      },
    });
  };

  updateLoopState();

  let shouldContinue = true;
  while (shouldContinue) {
    // Check abort signal at start of each iteration
    if (signal.aborted) {
      throw new Error('Loop execution aborted');
    }

    // Process child nodes
    for (const child of node.children) {
      for await (const result of walk(child, stateManager)) {
        if (Array.isArray(result)) {
          yield* result;
        } else {
          yield result;
        }
      }
    }

    i++;

    // Handle loop termination
    if (!hasCondition && i >= iterables.length) {
      shouldContinue = false;
      break;
    }

    // Update state for next iteration
    updateLoopState();

    // Evaluate condition for condition-based loops
    if (hasCondition) {
      const currentConfig = stateManager.getCurrentConfig(config);
      const resolvedCondition = resolveValue(condition, currentConfig);
      if (!truthy(resolvedCondition)) {
        shouldContinue = false;
        break;
      }
    }
  }

  // Clean up loop state
  // stateManager.popStack(GLOBAL_SCOPE);
}
