import type { RuntimeOptions } from "types"
import type { Block } from "@aim-sdk/compiler/types"
import { setBlockResult } from "state";

export const executeInputBlock = async (block: Block, options: RuntimeOptions, previousBlocks: Block[] = []): Promise<string | object> => {

    if (options.signal?.aborted) {
        throw new Error("Aborted");
    }

    const name = block.attributes?.name || "question"
    const description = block.attributes?.description || ""
    let type = block.attributes?.type || "text/plain" //application/json or others file types
    const src = block.attributes?.src || ""

    // Check if src starts with file://, http://, or https://
    if (src && !src.startsWith("file://") && !src.startsWith("http://") && !src.startsWith("https://")) {
        throw new Error("Source must start with file://, http://, or https://")
    }

    // If src is provided, fetch the file and determine type from extension
    if (src) {
        const fileExtension = src.split('.').pop()?.toLowerCase()
        switch(fileExtension) {
            case 'json':
                type = 'application/json'
                break
            case 'txt':
                type = 'text/plain'
                break
            case 'csv':
                type = 'text/csv'
                break
            case 'pdf':
                type = 'application/pdf'
                break
            case 'jpg':
            case 'jpeg':
                type = 'image/jpeg'
                break
            case 'png':
                type = 'image/png'
                break
            // Add more types as needed
        }
    }

    const inputValue = await options.onUserInput(JSON.stringify({ name, description, type, src }))

    setBlockResult({ block, result: inputValue })

    return inputValue
}