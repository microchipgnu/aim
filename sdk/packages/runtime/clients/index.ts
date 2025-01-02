import type { Block } from "@aim-sdk/compiler/types";
import type { RuntimeOptions } from "../types";
import { execute as nodeExecute } from "./node";
import { execute as browserExecute } from "./browser";

const isBrowser = typeof window !== 'undefined';

export const execute = async (blocks: Block[], options: RuntimeOptions): Promise<string[]> => {
    if (isBrowser) {
        return browserExecute(blocks, options);
    }
    return nodeExecute(blocks, options);
};

