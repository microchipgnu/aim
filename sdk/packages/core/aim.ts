import { functions, tags, type Schema } from "@markdoc/markdoc";
import * as jsEnvironment from "browser-or-node";
import { parser } from "markdoc/parser";
import { aiTag } from "markdoc/tags/ai";
import { flowTag } from "markdoc/tags/flow";
import { inputTag } from "markdoc/tags/input";
import { loopTag } from "markdoc/tags/loop";
import { setTag } from "markdoc/tags/set";
import { addToTextRegistry, clearTextRegistry, getCurrentConfigFx, getRuntimeContextFx, popStack, pushStack, registerPlugin, resetContext, setData } from "runtime/state";
import { execute } from "./clients";
import type { RuntimeOptions, StackFrame } from "./types";

const defaultRuntimeOptions: RuntimeOptions = {
    plugins: [],
    adapters: [],
    variables: {},
    input: {},
    events: {},
    signal: new AbortController().signal,
    timeout: 3000,
    maxRetries: 5,
    environment: jsEnvironment.isBrowser ? "browser" : "node",
    getReferencedFlow: undefined,
    config: {
        variables: {},
        tags: {
            ...tags,
            ai: aiTag,
            loop: loopTag,
            set: setTag,
            input: inputTag,
            flow: flowTag
        },
        functions: {
            ...functions
        }
    }
}

export function aim({ content, options = defaultRuntimeOptions }: { content: string, options: RuntimeOptions }) {
    // Register plugins in state
    options.plugins?.forEach(p => {
        registerPlugin({plugin: p.plugin, options: p.options});
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

    const { ast, validation, config, frontmatter } = parser(content, runtimeOptions);

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

    // if (frontmatter?.execute === false) {
    //     return {
    //         ast,
    //         errors: errors,
    //         warnings: warnings,
    //         execute: async (options: Partial<RuntimeOptions> = {}) => {
    //             return Promise.resolve();
    //         }
    //     }
    // }

    return {
        ast,
        frontmatter,
        errors: errors,
        warnings: warnings,
        execute: async () => {
            // Get input variables from document frontmatter
            const inputVariables = frontmatter?.input || [];
            const variables: Record<string, any> = {};

            // First try to get values from options.input or options.variables
            const inputValues = runtimeOptions.input || runtimeOptions.variables || {};

            // Map input variables using provided values or defaults from schema
            for (const variable of inputVariables) {
                const value = inputValues[variable.name];
                variables[variable.name] = value ?? variable.schema?.default;
            }

            const context = await getRuntimeContextFx();

            return execute({
                node: ast,
                config: runtimeOptions.config,
                execution: {
                    executeNode: async () => {
                        return Promise.resolve();
                    },
                    runtime: {
                        context: {
                            ...context,
                            methods: {
                                pushStack: async (frame: StackFrame) => { pushStack(frame) },
                                popStack: async () => { popStack() },
                                setData: async (data: Record<string, unknown>) => { setData(data) },
                                resetContext: async () => { resetContext() },
                                addToTextRegistry: async (text: string) => { addToTextRegistry(text) },
                                clearTextRegistry: async () => { clearTextRegistry() },
                                getCurrentConfig: getCurrentConfigFx,
                                getRuntimeContext: getRuntimeContextFx
                            },
                        },
                        options: runtimeOptions
                    }
                }
            });
        }
    };
}
