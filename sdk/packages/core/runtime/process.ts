import Markdoc, { Tag, type RenderableTreeNodes } from "@markdoc/markdoc";
import { aiTagWithRuntime } from "markdoc/tags/ai";
import { ifTagWithRuntime } from "markdoc/tags/conditionals";
import { loopTagWithRuntime } from "markdoc/tags/loop";
import { setTagWithRuntime } from "markdoc/tags/set";
import type { AIMRuntime } from "types";
import { runQuickJS } from "./code/quickjs";
import { addToTextRegistry, getCurrentConfigFx, getRuntimeContextFx, pushStack } from "./state";
import { GLOBAL_SCOPE } from "aim";
import { transform } from "markdoc/transform";

export async function executeNode({ node, config, execution }: AIMRuntime): Promise<RenderableTreeNodes> {
    // Get config with current stack state
    const currentConfig = await getCurrentConfigFx(config);
    const context = await getRuntimeContextFx();

    execution.runtime.options.events?.onStep?.(`Processing ${node.type} ${node.tag ? node.tag : ''}`);

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
            const transformedNode = await transform(node, currentConfig);

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
                    addToTextRegistry({ text: content, scope: execution.runtime.options.settings.useScoping ? execution.scope : GLOBAL_SCOPE });
                }
            }

            execution.runtime.options.events?.onData?.(transformedNode);

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
                },
                scope: execution.scope
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
                case 'if': {
                    return await ifTagWithRuntime.runtime({ node, config, execution });
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
                    return await transform(node, currentConfig);
                }
            }
        }
        default: {
            return await transform(node, currentConfig);
        }
    }
}

export async function* process({ node, config, execution }: AIMRuntime) {

    for (const child of node.children) {
        const result = await executeNode({ node: child, config, execution });


        // Store result in stack if id is provided
        const attrs = node.transformAttributes(config);
        if (attrs.id) {
            pushStack({
                id: attrs.id,
                variables: {
                    result: result
                },
                scope: execution.runtime.options.settings.useScoping ? execution.scope : GLOBAL_SCOPE
            });
        }

        yield result;
    }
}

