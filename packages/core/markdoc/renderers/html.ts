import { type RenderableTreeNode, renderers } from '@markdoc/markdoc';

export const html = (renderableTreeNodes: RenderableTreeNode[]): string => {
  return renderers.html(renderableTreeNodes);
};
