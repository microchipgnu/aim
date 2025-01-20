import * as jsEnvironment from "browser-or-node";
import type { AIMRuntime } from "../types";
import { execute as browserExecute } from "./browser";
import { execute as nodeExecute } from "./node";

export const execute = async ({ config, execution, node }: AIMRuntime): Promise<void> => {

    if (jsEnvironment.isBrowser) {
        await browserExecute({ node, config, execution });
    }
    else if (jsEnvironment.isNode) {
        await nodeExecute({ node, config, execution });
    }
    else {
        throw new Error("Unsupported environment");
    }
};

