import { type Config, type Node, Tag, tags } from "@markdoc/markdoc";
import { GLOBAL_SCOPE } from "aim";
import { nanoid } from "nanoid";
import { walk } from "runtime/process";
import { pushStack } from "runtime/state";

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
export const elseTag = tags.else;

export async function* if_(node: Node, config: Config) {
    const attrs = node.transformAttributes(config);
    const conditions = renderConditions(node);

    let ifTag = new Tag("if");
    yield ifTag;

    const children = [];
    const id = attrs.id || nanoid();

    for (const { condition, children: conditionChildren, type } of conditions) {
        const resolvedCondition = condition?.resolve ? condition.resolve(config) : condition;
        
        if (resolvedCondition) {
            pushStack({
                id,
                scope: GLOBAL_SCOPE,
                variables: {
                    condition: resolvedCondition,
                    isTrue: true,
                    branch: type
                }
            });

            for (const child of conditionChildren) {
                for await (const result of walk(child)) {
                    children.push(result);
                }
            }

            break;
        }
    }

    ifTag.children = children.flat();
}
