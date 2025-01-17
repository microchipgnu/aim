import type { AIMRuntime, RuntimeContext, RuntimeOptions } from "../types";
import { execute as nodeExecute } from "./node";
import { execute as browserExecute } from "./browser";
import { type Node } from "@markdoc/markdoc";
import * as jsEnvironment from "browser-or-node"

export const execute = async ({ config, execution, node }: AIMRuntime): Promise<string[]> => {

    if (jsEnvironment.isBrowser) {
        return browserExecute({ node, config, execution });
    }
    else if (jsEnvironment.isNode) {
        return nodeExecute({ node, config, execution });
    }
    else {
        throw new Error("Unsupported environment");
    }
};

