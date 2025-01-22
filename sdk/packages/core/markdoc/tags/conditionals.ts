import { type Schema, Tag, tags } from "@markdoc/markdoc";
import { GLOBAL_SCOPE } from "aim";
import { nanoid } from "nanoid";
import { executeNode } from "runtime/process";
import { clearTextRegistry, popStack, pushStack } from "runtime/state";
import type { AIMRuntime, AIMTag } from "types";

type Condition = { condition: any; children: any[]; type: 'if' | 'else' };

function renderConditions(node: any) {
    const conditions: Condition[] = [
        { condition: node.attributes.primary, children: [], type: 'if' },
    ];
    for (const child of node.children) {
        if (child.type === 'tag' && child.tag === 'else')
            conditions.push({
                condition:
                    'primary' in child.attributes ? child.attributes.primary : true,
                children: [],
                type: 'else'
            });
        else conditions[conditions.length - 1].children.push(child);
    }
    return conditions;
}

export const ifTag = tags.if;

export const ifTagWithRuntime: AIMTag = {
    ...ifTag,
    runtime: async ({ node, config, execution }: AIMRuntime) => {
        if (!execution.executeNode) {
            throw new Error('If tag must have executeNode function');
        }

        const conditionalsScope = execution.runtime.options.settings.useScoping ? execution.scope : GLOBAL_SCOPE;

        let result = ""

        const currentConfig = await execution.runtime.context.methods.getCurrentConfig(config);
        const attrs = node.transformAttributes(currentConfig);
        const conditions = renderConditions(node);

        const id = attrs.id || nanoid();
        const results = [];

        for (const { condition, children, type } of conditions) {
            const resolvedCondition = condition?.resolve ? condition.resolve(currentConfig) : condition;
            
            if (resolvedCondition) {
                execution.runtime.options.events?.onData?.(new Tag('if'));
                const scope = execution.runtime.options.settings.useScoping ? nanoid() : GLOBAL_SCOPE;
                pushStack({
                    id,
                    scope: scope,
                    variables: {
                        condition: resolvedCondition,
                        isTrue: true,
                        branch: type
                    }
                });

                const branchResults = [];
                for (const child of children) {
                    const result = await executeNode({
                        node: child, config, execution: {
                            ...execution,
                            scope: scope
                        }
                    });
                    if (result !== null) {
                        branchResults.push(result);
                    }
                }
                results.push(branchResults);
                result = JSON.stringify(branchResults, null, 2);

                // execution.runtime.options.events?.onData?.("end if");

                if (execution.runtime.options.settings.useScoping) {
                    popStack({ scope: scope });
                    clearTextRegistry({ scope: scope });
                }

                break;
            }
        }

        if (execution.runtime.options.settings.useScoping) {
            popStack({ scope: conditionalsScope });
            clearTextRegistry({ scope: conditionalsScope });
        }

        return new Tag('if', {}, []);
    }
}

export const elseTag = tags.else;
