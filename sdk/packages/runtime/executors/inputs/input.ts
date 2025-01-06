import type { RuntimeOptions } from "types"
import type { Block } from "@aim-sdk/compiler/types"
import { setBlockResult } from "state";

export const executeInputBlock = async (block: Block, options: RuntimeOptions, previousBlocks: Block[] = []): Promise<string | object> => {

    if (options.signal?.aborted) {
        throw new Error("Aborted");
    }

    const name = block.attributes?.name || "question"
    const description = block.attributes?.description || ""
    const type = block.attributes?.type || "text/plain" //application/json or others file types

    const inputValue = await options.onUserInput(JSON.stringify({ name, description, type }))

    setBlockResult({ block, result: inputValue })

    return inputValue
}