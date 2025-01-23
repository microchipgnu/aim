import { functions, nodes, tags, type Schema } from "@markdoc/markdoc";
import * as jsEnvironment from "browser-or-node";
import { fenceNode } from "markdoc/nodes/fence";
import { parser } from "markdoc/parser";
import { aiTag } from "markdoc/tags/ai";
import { elseTag, ifTag } from "markdoc/tags/conditionals";
import { flowTag } from "markdoc/tags/flow";
import { inputTag } from "markdoc/tags/input";
import { loopTag } from "markdoc/tags/loop";
import { setTag } from "markdoc/tags/set";
import { addToTextRegistry, clearTextRegistry, getCurrentConfigFx, getRuntimeContextFx, popStack, pushStack, registerPlugin, registerRuntimeState, resetContext, setData } from "runtime/state";
import { execute } from "./runtime/execute";
import type { RuntimeOptions, RuntimeState, StackFrame } from "./types";

export const GLOBAL_SCOPE = "global";

const defaultRuntimeOptions: RuntimeOptions = {
    plugins: [],
    adapters: [],
    variables: {},
    input: {},
    events: {},
    signal: new AbortController().signal,
    timeout: 50000,
    maxRetries: 5,
    environment: jsEnvironment.isBrowser ? "browser" : "node",
    getReferencedFlow: undefined,
    settings: {
        useScoping: false
    },
    config: {
        variables: {},
        nodes: {
            ...nodes,
            fence: fenceNode
        },
        tags: {
            ...tags,
            ai: aiTag,
            loop: loopTag,
            set: setTag,
            input: inputTag,
            flow: flowTag,
            if: ifTag,
            else: elseTag
        },
        functions: {
            ...functions
        }
    }
}

export function aim({ content, options = defaultRuntimeOptions }: { content: string, options: RuntimeOptions }) {

    // Register plugins in state
    options.plugins?.forEach(p => {
        registerPlugin({ plugin: p.plugin, options: p.options });
    });

    // Convert plugins to Markdoc tags
    const pluginsConvertedToMarkdocTags: Record<string, Schema> = options.plugins?.reduce((acc, p) => {
        const tags = Object.entries(p.plugin.tags || {}).reduce((filtered, [key, tag]) => {
            const { runtime, ...tagWithoutRuntime } = tag as any;
            return {
                ...filtered,
                [key]: tagWithoutRuntime
            };
        }, {});
        return {
            ...acc,
            ...tags
        };
    }, {}) || {};

    const runtimeOptions = {
        ...defaultRuntimeOptions,
        ...options,
        config: {
            ...defaultRuntimeOptions.config,
            ...options.config,
            tags: {
                ...defaultRuntimeOptions.config.tags,
                ...pluginsConvertedToMarkdocTags
            }
        },
        events: {
            ...defaultRuntimeOptions.events,
            ...options.events
        }
    }

    const { ast, validation, frontmatter } = parser(content, runtimeOptions);

    const warnings = validation
        .map(error => ({
            ...error,
            error: {
                ...error.error,
                level: error.error?.id === 'variable-undefined' ? 'warning' : error.error?.level
            }
        }));

    const errors = validation.filter(error =>
        error.error?.level === 'error' && error.error?.id !== 'variable-undefined'
    );

    return {
        ast,
        frontmatter,
        errors: errors,
        warnings: warnings,
        runtimeOptions,
        execute: async (variables?: Record<string, any>) => {
            // Get input variables from document frontmatter
            const inputVariables = frontmatter?.input || [];
            const resolvedVariables: Record<string, any> = {};

            // First try to get values from passed variables, then options.input or options.variables
            const inputValues = variables || runtimeOptions.input || runtimeOptions.variables || {};

            // Map input variables using provided values or defaults from schema
            for (const variable of inputVariables) {
                const value = inputValues[variable.name];
                resolvedVariables[variable.name] = value ?? variable.schema?.default;
            }

            // Create a nested input object for frontmatter access
            const inputObject = {
                ...inputValues // Include all input values directly
            };

            if(Object.keys(inputObject).length > 0) {
                pushStack({
                    id: "frontmatter",
                    variables: {
                        ...inputObject
                    },
                    scope: GLOBAL_SCOPE
                });
            }

            const context = await getRuntimeContextFx();

            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Execution timed out')), runtimeOptions.timeout);
            });

            const runtimeState: RuntimeState = {
                options: {
                    ...runtimeOptions,
                    config: {
                        ...runtimeOptions.config,
                        variables: {
                            ...runtimeOptions.config.variables,
                            frontmatter: {
                                ...frontmatter,
                                ...inputObject
                            }
                        }
                    }
                },
                context: {
                    ...context,
                    methods: {
                        pushStack: async (frame: StackFrame) => { pushStack(frame) },
                        popStack: async (params: { scope: string }) => { popStack(params) },
                        setData: async (params: { data: Record<string, any>; scope: string }) => { setData(params) },
                        resetContext: async () => { resetContext() },
                        addToTextRegistry: async (params: { text: string; scope: string }) => { addToTextRegistry(params) },
                        clearTextRegistry: async (params: { scope: string }) => { clearTextRegistry(params) },
                        getCurrentConfig: getCurrentConfigFx,
                        getRuntimeContext: getRuntimeContextFx
                    },
                }
            };

            registerRuntimeState(runtimeState);

            await Promise.race([
                execute({
                    node: ast,
                    state: runtimeState
                }),
                timeoutPromise
            ]);
        }
    };
}
