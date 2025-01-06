import type { Block } from "@aim-sdk/compiler"
import type { RuntimeOptions } from "../types"
import { executeBlocks } from "../executors"

export const executeContainerBlock = async (block: Block, options: RuntimeOptions, previousBlocks: Block[] = []): Promise<string | object> => {

    if (options.signal?.aborted) {
        throw new Error("Aborted");
    }

    return executeBlocks(block.children, options)
}   