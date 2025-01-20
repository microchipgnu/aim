import Markdoc, { Tag, type Node } from "@markdoc/markdoc";
import { aiTagWithRuntime } from "markdoc/tags/ai";
import { loopTagWithRuntime } from "markdoc/tags/loop";
import { setTagWithRuntime } from "markdoc/tags/set";
import type { AIMRuntime } from "types";
import { runQuickJS } from "./code/quickjs";
import { addToTextRegistry, getCurrentConfigFx, getRuntimeContextFx, pushStack } from "./state";

export async function _process({ node, config, execution }: AIMRuntime) {
    async function executeNode(node: Node): Promise<any> {

        const currentConfig = await getCurrentConfigFx(config);
        const context = await getRuntimeContextFx();

        execution.runtime.options.events?.onStep?.(`Processing ${node.type}  ${node.tag ? node.tag : ''}`);

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
            case 'heading': {
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

                const { evalCode } = await runQuickJS({
                    env: {
                        __AIM_VARIABLES__: JSON.stringify(currentConfig.variables),
                    },
                });

                const evalResult = await evalCode(`
                    import { aimVariables } from "load-vars";
                    ${node.attributes.content}
                `);

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
            case 'tag': {
                switch (node.tag) {
                    case 'set': {
                        return await setTagWithRuntime.runtime({ node, config, execution });
                    }
                    case 'loop': {
                        return await loopTagWithRuntime.runtime({ node, config, execution });
                    }
                    case 'ai': {
                        return await aiTagWithRuntime.runtime({ node, config, execution });
                    }
                    default: {
                        if (node.tag) {
                            const plugin = context.plugins.get(node.tag);
                            if (plugin?.tags && node.tag in plugin.tags) {
                                const tagConfig = plugin.tags[node.tag];
                                if ('runtime' in tagConfig) {
                                    return await tagConfig.runtime({ node, config, execution });
                                }
                            }
                        }
                        return Markdoc.transform(node, currentConfig);
                    }
                }
            }
            default:
                return Markdoc.transform(node, currentConfig);
        }
    }

    const result = await executeNode(node);
    return { result, context: await getRuntimeContextFx() };
}

export async function* process({ node, config, execution }: AIMRuntime) {

    let currentContext = await getRuntimeContextFx();

    for (const child of node.children) {
        const { context, result } = await _process({ node: child, config, execution, });
        currentContext = context;
        yield result;
    }

    return { context: currentContext };
}

