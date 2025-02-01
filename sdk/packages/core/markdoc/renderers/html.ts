import { renderers, type RenderableTreeNode } from "@markdoc/markdoc";

export const html = (renderableTreeNodes: RenderableTreeNode[]): string => {
	return renderers.html(renderableTreeNodes);
};
