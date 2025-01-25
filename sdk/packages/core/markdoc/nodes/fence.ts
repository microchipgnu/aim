import { nodes, Tag, type Config, type Node } from "@markdoc/markdoc";
import { GLOBAL_SCOPE } from "aim";
import { runQuickJS } from "runtime/code/quickjs";
import type { StateManager } from "runtime/state";

export const fenceNode = {
    ...nodes.fence,
    attributes: {
        ...nodes.fence.attributes,
        id: { type: String, required: false }
    }
}

export async function* fence(node: Node, config: Config, stateManager: StateManager) {
    const currentConfig = stateManager.getCurrentConfig(config);
    const attrs = node.transformAttributes(config);

    let fenceTag = new Tag("fence");
    yield fenceTag;

    const id = attrs.id || 'code';

    let language = node.attributes.language;
    if (!language) {
        // Try to detect language from content
        const content = attrs.content || '';
        if (content.includes('console.log') || content.includes('const ') || content.includes('let ') || content.includes('function')) {
            language = 'javascript';
        } else if (content.includes('print(') || content.includes('def ') || content.includes('import ')) {
            language = 'python';
        } else {
            language = 'text';
        }
    }

    const { evalCode } = await runQuickJS({
        env: {
            __AIM_VARIABLES__: JSON.stringify(currentConfig.variables),
        },
    });

    const evalResult = await evalCode(`
        import { aimVariables } from "load-vars";
        import { evaluate } from "eval-code";

        const run = async () => {
            ${node.attributes.content}
        }

        export default await run();
    `);

    const result = evalResult.ok ? JSON.stringify(evalResult.data) : "";

    stateManager.pushStack({
        id,
        variables: {
            result: evalResult.ok ? JSON.stringify(evalResult.data) : "",
            error: !evalResult.ok ? JSON.stringify(evalResult.error) : "",
        },
        scope: GLOBAL_SCOPE
    });

    fenceTag.children = [
        new Tag('code', { language }, [node.attributes.content]),
        result
    ];
}
