import Markdoc, { type Config, type Node } from "@markdoc/markdoc";
import { aiTagWithRuntime } from "markdoc/tags/ai";
import { loopTagWithRuntime } from "markdoc/tags/loop";
import { config as defaultConfig } from "../markdoc/config";
import { getCurrentConfigFx, getRuntimeContextFx } from "./state";

async function _process(ast: Node, config: Config) {
    async function executeNode(node: Node): Promise<any> {
        const currentConfig = await getCurrentConfigFx(config);

        console.log(JSON.stringify(await getRuntimeContextFx(), null, 2));

        switch (node.type) {
            case 'tag':
                switch (node.tag) {
                    case 'loop': {
                        return await loopTagWithRuntime.runtime(node, currentConfig, { executeNode });
                    }
                    case 'ai': {
                        return await aiTagWithRuntime.runtime(node, currentConfig, {});
                    }
                    default: {
                        return Markdoc.transform(node, currentConfig);
                    }
                }
            default:
                return Markdoc.transform(node, currentConfig);
        }
    }

    const result = await executeNode(ast);
    return { result, context: await getRuntimeContextFx() };
}

export async function process(ast: Node, config: Config = defaultConfig) {
    const execution = [];
    let currentContext = await getRuntimeContextFx();

    for (const child of ast.children) {
        const { context, result } = await _process(child, { ...config, variables: { ...config.variables, ...currentContext.data } });
        currentContext = context;
        execution.push(result);
    }

    return { execution, context: currentContext };
}