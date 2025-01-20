import { Tag, type RenderableTreeNode } from "@markdoc/markdoc";

export const text = (renderableTreeNodes: RenderableTreeNode[]): string => {
    let content = '';

    for (const node of renderableTreeNodes) {
        if (typeof node === 'string') {
            content += node;
        } else if (Array.isArray(node)) {
            content += node.map(n => {
                if (typeof n === 'string') return n;
                if (Tag.isTag(n)) return n.children?.join('') || '';
                return '';
            }).join('');
        } else if (Tag.isTag(node)) {
            content += node.children?.join('') || '';
        }
    }

    return content;
}