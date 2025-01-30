import { functions, nodes, tags, type Schema } from "@markdoc/markdoc";
import * as jsEnvironment from "browser-or-node";
import { add, divide, greaterThan, greaterThanOrEqual, includes, lessThan, lessThanOrEqual, multiply, subtract } from "markdoc/functions/functions";
import { fenceNode } from "markdoc/nodes/fence";
import { parser } from "markdoc/parser";
import { aiTag } from "markdoc/tags/ai";
import { elseTag, ifTag } from "markdoc/tags/conditionals";
import { flowTag } from "markdoc/tags/flow";
import { inputTag } from "markdoc/tags/input";
import { loopTag } from "markdoc/tags/loop";
import { setTag } from "markdoc/tags/set";
import { StateManager } from "runtime/state";
import { execute, executeGenerator } from "./runtime/execute";
import type { RuntimeOptions } from "./types";
import { mediaTag } from "markdoc/tags/media";

export const GLOBAL_SCOPE = "global";

export const defaultRuntimeOptions: RuntimeOptions = {
    plugins: [],
    adapters: [],
    variables: {},
    input: {},
    events: {},
    signals: {
        abort: new AbortController().signal
    },
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
            else: elseTag,
            media: mediaTag
        },
        functions: {
            ...functions,
            greaterThan,
            lessThan,
            greaterThanOrEqual,
            lessThanOrEqual,
            includes,
            add,
            subtract,
            multiply,
            divide
        }
    }
}

export function aim({ content, options = defaultRuntimeOptions }: { content: string, options: RuntimeOptions }) {

    const stateManager = new StateManager({
        ...options.config,
        variables: {
            ...options.config.variables
        }
    }, options);

    // Register plugins in state
    options.plugins?.forEach(p => {
        stateManager.registerPlugin(p.plugin, p.options);
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

    stateManager.$runtimeState.next({
        ...stateManager.getRuntimeState(),
        options: runtimeOptions
    });

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
        stateManager,
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
                stateManager.pushStack({
                    id: "frontmatter",
                    variables: {
                        ...inputObject
                    },
                    scope: GLOBAL_SCOPE
                });
            }

            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Execution timed out')), runtimeOptions.timeout);
            });

            const abortPromise = new Promise((_, reject) => {
                runtimeOptions.signals.abort.addEventListener('abort', () => reject(new Error('Execution aborted')));
            });

            await Promise.race([
                execute({
                    node: ast,
                    stateManager
                }),
                timeoutPromise,
                abortPromise
            ]);
        },
        executeWithGenerator: async function*(variables?: Record<string, any>) {
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
                stateManager.pushStack({
                    id: "frontmatter",
                    variables: {
                        ...inputObject
                    },
                    scope: GLOBAL_SCOPE
                });
            }

            const generator = executeGenerator({
                node: ast,
                stateManager
            });

            const timeoutId = setTimeout(() => {
                generator.throw(new Error('Execution timed out'));
            }, runtimeOptions.timeout);

            try {
                for await (const result of generator) {
                    if (runtimeOptions.signals.abort.aborted) {
                        throw new Error('Execution aborted');
                    }
                    yield result;
                }
            } finally {
                clearTimeout(timeoutId);
            }
        }
    };
}
