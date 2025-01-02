import type { Block, BlockType } from "@aim-sdk/compiler/types";
import { getBlockResult } from "./state";
import type { RuntimeOptions } from "./types";

export const getBlockContent = (block: Block, options: RuntimeOptions): string => {
    options.onLog(`Getting content for block type: ${block.type}`);
    
    // Handle variable references in set block attributes
    if (block.type === 'set' && block.attributes?.value !== undefined) {
        options.onLog(`Handling set block with value: ${JSON.stringify(block.attributes.value)}`);
        const value = block.attributes.value;
        if (typeof value === 'object' && value !== null && 'type' in value && value.type === 'variable') {
            options.onLog(`Resolving variable in set block`);
            return resolveVariable(value, options);
        }
        return typeof value === 'string' ? value : JSON.stringify(value);
    }

    // Handle string content
    if (typeof block.content === 'string') {
        options.onLog(`Handling string content: ${block.content}`);
        return block.content;
    } else if (Array.isArray(block.content)) {
        options.onLog(`Handling array content with ${block.content.length} items`);
        return block.content.map(c => getContentPart(c, options)).join(" ");
    }
    options.onLog(`No content found, returning empty string`);
    return "";
};

const resolveVariable = (varInfo: { type: 'variable', name: string, location?: { blockId: string, blockType: BlockType } }, options: RuntimeOptions): string => {
    options.onLog(`Resolving variable: ${varInfo.name}`);
    
    if (varInfo.location) {
        options.onLog(`Variable has location: ${JSON.stringify(varInfo.location)}`);
        if (varInfo.location.blockId === 'frontmatter' && varInfo.location.blockType === 'input') {
            options.onLog(`Checking frontmatter input variable`);
            const varValue = options.variables[varInfo.name];
            if (varValue !== undefined) {
                options.onLog(`Found value in frontmatter: ${JSON.stringify(varValue)}`);
                return typeof varValue === 'string' ? varValue : JSON.stringify(varValue);
            }
            options.onLog(`No value found in frontmatter`);
            return "";
        }
        const locationBlock: Block = {
            type: varInfo.location.blockType,
            id: varInfo.location.blockId,
            content: [],
            children: []
        };
        options.onLog(`Looking up block result for: ${varInfo.location.blockId}`);
        const blockResult = getBlockResult(locationBlock);
        if (blockResult?.result !== undefined) {
            options.onLog(`Found block result: ${JSON.stringify(blockResult.result)}`);
            return typeof blockResult.result === 'string' 
                ? blockResult.result 
                : JSON.stringify(blockResult.result);
        }
    }

    // Fallback to variables in options
    options.onLog(`Falling back to options variables`);
    const varValue = options.variables[varInfo.name];
    if (varValue !== undefined) {
        options.onLog(`Found value in options: ${JSON.stringify(varValue)}`);
        return typeof varValue === 'string' ? varValue : JSON.stringify(varValue);
    }
    options.onLog(`Variable not found: ${varInfo.name}`);
    return "";
}

const getContentPart = (content: unknown, options: RuntimeOptions): string => {
    options.onLog(`Getting content part of type: ${typeof content}`);

    if (typeof content === 'string') {
        options.onLog(`Handling string content: ${content}`);
        return content;
    }

    if (!content || typeof content !== 'object') {
        options.onLog(`Invalid content, returning empty string`);
        return '';
    }

    // Handle text content
    if ('type' in content && content.type === 'text') {
        options.onLog(`Handling text content`);
        return (content as { type: 'text', text: string }).text;
    }

    // Handle variable references
    if ('type' in content && content.type === 'variable') {
        options.onLog(`Handling variable reference`);
        return resolveVariable(content as { type: 'variable', name: string, location?: { blockId: string, blockType: BlockType } }, options);
    }

    // Handle nested blocks
    if ('children' in content) {
        options.onLog(`Handling nested block content`);
        return getBlockContent(content as Block, options);
    }

    options.onLog(`Unhandled content type, returning empty string`);
    return '';
};

export const getPreviousBlocksContent = (
    previousBlocks: Block[],
    options: RuntimeOptions,
    config: { maxBlocks?: number } = {}
): string => {
    options.onLog(`Getting content from ${previousBlocks.length} previous blocks`);
    const { maxBlocks } = config;
    const blocksToProcess = maxBlocks ? previousBlocks.slice(-maxBlocks) : previousBlocks;
    options.onLog(`Processing ${blocksToProcess.length} blocks`);
    return blocksToProcess
        .map(b => getBlockContentRecursive(b, options))
        .join("\n");
};

const getBlockContentRecursive = (block: Block, options: RuntimeOptions): string => {
    options.onLog(`Getting recursive content for block type: ${block.type}`);
    let content = getBlockContent(block, options);
    if (block.children && block.children.length > 0) {
        options.onLog(`Processing ${block.children.length} child blocks`);
        content += '\n' + block.children.map(child => {
            if ('type' in child) {
                return getBlockContentRecursive(child as Block, options);
            }
            options.onLog(`Invalid child block, skipping`);
            return '';
        }).join('\n');
    }
    return content;
};