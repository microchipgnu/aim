import type { Block, BlockType } from "@aim-sdk/compiler/types";
import { executeGenerationBlock } from "../executors/ai/ai";
import { executeStructuredOutputBlock } from "../executors/ai/structured-output";
import { executeCodeBlock } from "../executors/logic/code";
import { executeLoopBlock } from "../executors/logic/loop";
import { executeSetBlock } from "../executors/logic/set";
import { setBlockResult } from "../state";
import type { BlockExecutor, RuntimeOptions } from "../types";
import { getBlockContent } from "../utils";
import { executeReplicateBlock } from "./tools/replicate";
import { executeContainerBlock } from "./container";

export const defaultExecutor: BlockExecutor = async (block: Block, options: RuntimeOptions) => {
    const result = getBlockContent(block, options);
    setBlockResult({ block, result });

    let results: (string | object | void)[] = [];

    results.push(result);

    if (block.children && block.children.length > 0) {
        options.onLog(`Executing ${block.children.length} child blocks`);
        const iterationResults = await executeBlocks(block.children, options);
        options.onLog(`Child blocks execution completed`);
        results = results.concat(iterationResults);
    }
    
    return Promise.resolve(results);
};

export const blockExecutors: Record<BlockType, BlockExecutor> = {
    'default': defaultExecutor,
    'container': executeContainerBlock,
    'ai': executeGenerationBlock,
    'structured': executeStructuredOutputBlock,
    'string': defaultExecutor,
    'text': defaultExecutor,
    'code': executeCodeBlock,
    'def': defaultExecutor,
    'escape': defaultExecutor,
    'list_item': defaultExecutor,
    'image': defaultExecutor,
    'variable': defaultExecutor,
    'set': executeSetBlock,
    'loop': executeLoopBlock,
    'for': executeLoopBlock,
    'input': defaultExecutor,
    'media': defaultExecutor,
    'flow': defaultExecutor,
    'heading': defaultExecutor,
    'paragraph': defaultExecutor,
    'list': defaultExecutor,
    'blockquote': defaultExecutor,
    'html': defaultExecutor,
    'hr': defaultExecutor,
    'table': defaultExecutor,
    'strong': defaultExecutor,
    'em': defaultExecutor,
    'codespan': defaultExecutor,
    'br': defaultExecutor,
    'del': defaultExecutor,
    'link': defaultExecutor,
    'space': defaultExecutor,
    'textDirective': defaultExecutor,
    'leafDirective': defaultExecutor,
    'containerDirective': defaultExecutor,
    'replicate': executeReplicateBlock,
};

export const executeBlocks = async (blocks: Block[], options: RuntimeOptions): Promise<(string | object | void)[]> => {
    const checkAbort = () => {
        if (options.signal?.aborted) {
            throw new Error("Aborted");
        }
    };

    const executeBlock = async (block: Block, index: number, previousBlocks: Block[]): Promise<string | object | void> => {
        checkAbort();

        options.onStep(`Executing block ${index + 1} of ${blocks.length}`);
        options.onLog(`Executing block: ${block.type || 'unknown'}`);

        let blockType = block.type || 'default';

        if (blockType.endsWith('Directive')) {
            blockType = block.name as BlockType;
        }

        const executor = (blockExecutors[blockType] as BlockExecutor | undefined) ?? defaultExecutor;
        const result = await executor(block, options, previousBlocks);
        
        options.onData(result);

        // Convert any number results to strings to satisfy return type 
        return typeof result === 'number' ? result.toString() : result;
    };

    return blocks.reduce(async (resultsPromise, block, index) => {
        const results = await resultsPromise;
        const result = await executeBlock(block, index, blocks.slice(0, index));
        return result !== undefined ? [...results, result] : results;
    }, Promise.resolve([] as (string | object | void)[]));
};