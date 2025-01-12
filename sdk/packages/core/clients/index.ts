import type { RuntimeOptions } from "../types";
import { execute as nodeExecute } from "./node";
import { execute as browserExecute } from "./browser";
import {type Node} from "@markdoc/markdoc";

const isBrowser = typeof window !== 'undefined';

export const execute = async (ast: Node, options: RuntimeOptions): Promise<string[]> => {
    if (isBrowser) {
        return browserExecute(ast, options);
    }
    return nodeExecute(ast, options);
};

