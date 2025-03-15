import type { Config, Node, RenderableTreeNode } from '@markdoc/markdoc';
import { Tag, nodes } from '@markdoc/markdoc';
import { GLOBAL_SCOPE } from '../../aim';
import type { AIMConfig, StateManager } from '../../types';

export const fenceNode = {
  ...nodes.fence,
  attributes: {
    ...nodes.fence.attributes,
    id: { type: String, required: false },
  },
};

export async function* fence(
  node: Node,
  config: AIMConfig,
  stateManager: StateManager,
) {
  const currentConfig = stateManager.getCurrentConfig(config);
  const attrs = node.transformAttributes(config as Config);

  const fenceTag = new Tag('fence');
  yield fenceTag;

  const id = attrs.id || 'code';

  let language = node.attributes.language;
  if (!language) {
    // Try to detect language from content
    const content = attrs.content || '';
    if (
      content.includes('console.log') ||
      content.includes('const ') ||
      content.includes('let ') ||
      content.includes('function')
    ) {
      language = 'javascript';
    } else if (
      content.includes('print(') ||
      content.includes('def ') ||
      content.includes('import ')
    ) {
      language = 'python';
    } else {
      language = 'text';
    }
  }

  const adapter = stateManager.getAdapter('code');

  if (adapter) {
    try {
      const result = await adapter.handlers.eval(
        [
          node.attributes.content,
          language,
          currentConfig.variables,
        ],
        { manager: stateManager },
      );

      const serializedResult = JSON.stringify(result) || '';

      stateManager.pushStack({
        id,
        scope: GLOBAL_SCOPE,
        variables: {
          result: serializedResult,
        },
      });

      fenceTag.children = [
        new Tag('code', { language }, [node.attributes.content]),
        result as RenderableTreeNode,
      ];
    } catch (err) {
      stateManager.pushStack({
        id,
        scope: GLOBAL_SCOPE,
        variables: {
          result: '',
          error: JSON.stringify(err instanceof Error ? err.message : err),
          success: false,
        },
      });
    }
  }
}
