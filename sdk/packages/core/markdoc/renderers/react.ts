import { renderers, type RenderableTreeNode } from "@markdoc/markdoc";
import type React from "react";

export const react = (
	renderableTreeNodes: RenderableTreeNode[],
	React: Readonly<{
		createElement: any;
		Fragment: any;
	}>,
	options?: {
		components?: Record<string, unknown>;
	},
): React.ReactNode => {
	return renderers.react(renderableTreeNodes, React, options);
};

export const reactStatic = (
	renderableTreeNodes: RenderableTreeNode[],
): React.ReactNode => {
	return renderers.reactStatic(renderableTreeNodes);
};
