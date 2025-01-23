import { Tag, type RenderableTreeNodes } from "@markdoc/markdoc";

export const text = (renderableTreeNodes: RenderableTreeNodes | null): string => {
    if (!renderableTreeNodes) return '';
    
    let content = '';
    const nodes = Array.isArray(renderableTreeNodes) ? renderableTreeNodes : [renderableTreeNodes];

    for (const node of nodes) {
        if (typeof node === 'string') {
            content += node;
        } else if (typeof node === 'number') {
            content += node.toString();
        } else if (Array.isArray(node)) {
            content += node.map(n => {
                if (typeof n === 'string') return n;
                if (typeof n === 'number') return n.toString();
                if (Tag.isTag(n)) return n.children?.join('') || '';
                return '';
            }).join('');
        } else if (Tag.isTag(node)) {
            content += node.children?.join('') || '';
        }
    }

    return content;
}