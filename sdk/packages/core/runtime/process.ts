import { Tag, type Node, type RenderableTreeNode, type RenderableTreeNodes } from "@markdoc/markdoc";
import { GLOBAL_SCOPE } from "aim";
import { fence } from "markdoc/nodes/fence";
import { text } from "markdoc/renderers/text";
import { ai } from "markdoc/tags/ai";
import { if_ } from "markdoc/tags/conditionals";
import { flow } from "markdoc/tags/flow";
import { input } from "markdoc/tags/input";
import { loop } from "markdoc/tags/loop";
import { set } from "markdoc/tags/set";
import { transform } from "markdoc/transform";
import type { AIMRuntime } from "types";
import { StateManager } from "./state";
import { parallel } from "markdoc/tags/parallel";
import { media } from "markdoc/tags/media";
import { group } from "markdoc/tags/group";

export async function* walk(node: Node, stateManager: StateManager): AsyncGenerator<RenderableTreeNodes> {
    const runtimeState = stateManager.getRuntimeState();
    const signal = runtimeState.options.signals.abort;

    if (signal.aborted) {
        throw new Error('Operation aborted');
    }

    const config = stateManager.getCurrentConfig(runtimeState.options.config);

    switch (node.type) {
        case "paragraph":
        case "heading":
        case "list": 
        case "item":
        case "inline":
            yield* handleContainerNode(node, config, stateManager);
            break;
        case "text":
            yield* handleTextNode(node, config, runtimeState);
            break;
        case "fence":
            yield* fence(node, config, stateManager);
            break;
        case "tag":
            yield* handleTag(node, stateManager);
            break;
        default:
            break;
    }
}

async function* handleContainerNode(node: Node, config: any, stateManager: StateManager): AsyncGenerator<RenderableTreeNodes> {
    const children = [];

    // Process all children first to get renderable tree nodes
    for (const child of node.children) {
        if (child.type === "text") {
            for await (const result of handleTextNode(child, config, stateManager.getRuntimeState())) {
                children.push(result);
            }
        } else {
            for await (const result of walk(child, stateManager)) {
                children.push(result);
            }
        }
    }
    // TODO: Need to recreate node because https://github.com/markdoc/markdoc/commit/2e2d2c4f6736300d0973b833b78e7b6a797357ea hasn't been released yet
    // Clone the node while preserving prototype chain
    const clonedNode = Object.create(
      Object.getPrototypeOf(node),
      Object.getOwnPropertyDescriptors(node)
    );
    clonedNode.children = [];

    const transformedNode = clonedNode.transform(config);

    let containerTag: Tag;
    
    if (Tag.isTag(transformedNode)) {
        // If transformedNode is a Tag, use its properties
        containerTag = new Tag(
            transformedNode.name,
            transformedNode.attributes,
            children.flat() as RenderableTreeNode[]
        );
    } else {
        // Otherwise fall back to node properties
        containerTag = new Tag(
            node.type,
            node.transformAttributes(config),
            children.flat() as RenderableTreeNode[]
        );
    }

    yield containerTag;
}

async function* handleTextNode(node: Node, config: any, runtimeState: any): AsyncGenerator<RenderableTreeNodes> {
    const result = await transform?.(node, config);
    runtimeState.context.methods.addToTextRegistry({
        text: text(result),
        scope: GLOBAL_SCOPE
    });
    yield result;
}

async function* handleTag(node: Node, stateManager: StateManager): AsyncGenerator<RenderableTreeNodes> {
    const runtimeState = stateManager.getRuntimeState();
    const config = stateManager.getCurrentConfig(runtimeState.options.config);

    switch (node.tag) {
        case "loop": {
            yield* loop(node, config, stateManager);
            break;
        }
        case "ai": {
            yield* ai(node, config, stateManager);
            break;
        }
        case "set": {
            yield* set(node, config, stateManager);
            break;
        }
        case "if": {
            yield* if_(node, config, stateManager);
            break;
        }
        case "flow": {
            yield* flow(node, config, stateManager);
            break;
        }
        case "input": {
            yield* input(node, config, stateManager);
            break;
        }
        case "parallel": {
            yield* parallel(node, config, stateManager);
            break;
        }
        case "media": {
            yield* media(node, config, stateManager);
            break;
        }
        case "group": {
            yield* group(node, config, stateManager);
            break;
        }
        default: {
            // TODO: handle plugins
            const context = runtimeState.context;
            const plugins = context.plugins;

            if (!node.tag) {
                break;
            }

            const [pluginName, tagName] = node.tag.split("_");

            const plugin = plugins.get(pluginName);
            
            if (plugin?.tags && tagName && tagName in plugin.tags) {
                const tagConfig = plugin.tags[tagName];
                if ('execute' in tagConfig) {
                    plugin.hooks?.beforeExecution?.(context);
                    const result = yield* tagConfig.execute({ node, config, state: runtimeState });
                    plugin.hooks?.afterExecution?.(context, result);
                }
            }
            break;
        }
    }
}

export async function* process({ node, stateManager }: AIMRuntime) {
    const signal = stateManager.getRuntimeState().options.signals.abort;
    
    for (const child of node.children) {
        if (signal.aborted) {
            throw new Error('Operation aborted');
        }

        for await (const result of walk(child, stateManager)) {
            yield result;
        }
    }
}
