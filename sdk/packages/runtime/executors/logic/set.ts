import type { Block } from "@aim-sdk/compiler/types";
import type { RuntimeOptions } from "../../types";
import { getBlockResultById, setBlockResult } from "../../state";

export const executeSetBlock = async (block: Block, options: RuntimeOptions, previousBlocks: Block[] = []): Promise<string | object | void | number> => {
    if (options.signal?.aborted) {
        throw new Error("Aborted");
    }

    const {
        value = ''
    } = block.attributes || {};

    let resolvedValue = value;

    if (typeof value === 'object' && value !== null && value.type === 'variable') {
        const varInfo = value as { type: 'variable', name: string, location?: { blockId: string, blockType: string } };
        
        if (varInfo.location) {
            const varResult = getBlockResultById(varInfo.location.blockId);
            if (varResult && varResult.result != null) {
                resolvedValue = varResult.result;
            }
        }
    }
    else if (typeof value === 'string' && value.includes('$')) {
        const match = value.match(/\$([a-zA-Z0-9_.-]+)/);
        if (match) {
            const varName = match[1];
            const varResult = getBlockResultById(varName);
            if (varResult && varResult.result != null) {
                resolvedValue = String(varResult.result).trim();
            }
        }
    }

    setBlockResult({ block, result: resolvedValue });

    return Promise.resolve(resolvedValue);
}   