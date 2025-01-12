import Markdoc, { Tag, type Config, type Node } from "@markdoc/markdoc";
import { aiTagWithRuntime } from "markdoc/tags/ai";
import { loopTagWithRuntime } from "markdoc/tags/loop";
import { config as defaultConfig } from "../markdoc/config";
import { runQuickJS } from "./code/quickjs";
import { getCurrentConfigFx, getRuntimeContextFx, pushStack, addToTextRegistry, clearTextRegistry, $textRegistry, $runtimeContext } from "./state";

async function _process(ast: Node, config: Config) {
    async function executeNode(node: Node): Promise<any> {
        const currentConfig = await getCurrentConfigFx(config);

        switch (node.type) {
            case 'text':    
            case 'paragraph':
            case 'softbreak':
            case 'hardbreak':
            case 'strong':
            case 'em':
            case 'link':
            case 'image':
            case 's':
            case 'list':
            case 'item':
            case 'table':
            case 'thead':
            case 'tbody': 
            case 'tr':
            case 'th':
            case 'td':
            case 'heading':{
                const transformedNode = Markdoc.transform(node, currentConfig);

                if (transformedNode) {
                    let content = '';
                    
                    if (typeof transformedNode === 'string') {
                        content = transformedNode;
                    } else if (Array.isArray(transformedNode)) {
                        content = transformedNode.map(n => {
                            if (typeof n === 'string') return n;
                            if (Tag.isTag(n)) return n.children?.join('') || '';
                            return '';
                        }).join('');
                    } else if (Tag.isTag(transformedNode)) {
                        content = transformedNode.children?.join('') || '';
                    }

                    if (content) {
                        addToTextRegistry(content);
                    }
                }

                return transformedNode;
            }

            case 'fence': {
                const attrs = node.transformAttributes(currentConfig);

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

                const { evalCode } = await runQuickJS();
                const evalResult = await evalCode(node.attributes.content);

                const result = evalResult.ok ? JSON.stringify(evalResult.data) : "";

                pushStack({
                    id,
                    variables: {
                        result: evalResult.ok ? JSON.stringify(evalResult.data) : "",
                        error: !evalResult.ok ? JSON.stringify(evalResult.error) : "",
                    }
                });

                return [new Tag('code', {
                    language,
                }, node.attributes.content), result]
            }
            case 'tag':
                switch (node.tag) {
                    case 'loop': {
                        return await loopTagWithRuntime.runtime(node, currentConfig, { executeNode });
                    }
                    case 'ai': {
                        // Clear registry after AI processing
                        const result = await aiTagWithRuntime.runtime(node, currentConfig, {});
                        clearTextRegistry();
                        return result;
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

export async function* process(ast: Node, config: Config = defaultConfig) {
    let currentContext = await getRuntimeContextFx();

    for (const child of ast.children) {
        const { context, result } = await _process(child, { ...config, variables: { ...config.variables, ...currentContext.data } });
        currentContext = context;
        yield result;
    }

    return { context: currentContext };
}

