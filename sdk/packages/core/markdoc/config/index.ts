
import { functions, tags } from "@markdoc/markdoc";
import type { AIMConfig } from "../../types";
import { aiTag } from "../tags/ai";
import { loopTag } from "../tags/loop";

export const config: AIMConfig = {
    variables: {},
    tags: {
        ...tags,
        ai: aiTag,
        loop: loopTag
    },
    functions: {
        ...functions
    }
}