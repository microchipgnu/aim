
import { functions, tags } from "@markdoc/markdoc";
import type { AIMConfig } from "../../types";
import { aiTag } from "../tags/ai";
import { loopTag } from "../tags/loop";
import { setTag } from "markdoc/tags/set";
import { inputTag } from "markdoc/tags/input";
import { flowTag } from "markdoc/tags/flow";

export const config: AIMConfig = {
    variables: {},
    tags: {
        ...tags,
        ai: aiTag,
        loop: loopTag,
        set: setTag,
        input: inputTag,
        flow: flowTag
    },
    functions: {
        ...functions
    }
}