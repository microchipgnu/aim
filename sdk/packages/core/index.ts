import { parser } from "markdoc/parser";
import { execute } from "./clients";
import { config as defaultConfig } from "./markdoc/config";
import type { RuntimeOptions } from "./types";

export async function aim(strings: TemplateStringsArray, ...values: any[]) {
    const text = strings.reduce((result, str, i) =>
        result + str + (values[i] || ''),
        '');


    const { ast, validation, config, frontmatter } = await parser(text);

    if (frontmatter?.execute === false) {
        return {
            ast,
            errors: [],//errors,
            warnings: [],
            execute: async (options: Partial<RuntimeOptions> = {}) => {
                return Promise.resolve();
            }
        }
    }

    return {
        ast,
        errors: [],//errors,
        warnings: [],
        execute: async (options: Partial<RuntimeOptions> = {}) => {
            const abortController = new AbortController();

            // Get input variables from document frontmatter
            const inputVariables = frontmatter?.input || [];
            const variables: Record<string, any> = {};

            // First try to get values from options.input or options.variables
            const inputValues = options.input || options.variables || {};

            // Map input variables using provided values or defaults from schema
            for (const variable of inputVariables) {
                const value = inputValues[variable.name];
                variables[variable.name] = value ?? variable.schema?.default;
            }

            return execute(ast, {
                config: config || defaultConfig,
                onLog: options.onLog || (() => { }),
                onError: options.onError || (() => { }),
                onSuccess: options.onSuccess || (() => { }),
                onAbort: options.onAbort || (() => { }),
                onFinish: options.onFinish || (() => { }),
                onStart: options.onStart || (() => { }),
                onStep: options.onStep || (() => { }),
                onData: options.onData || (() => { }),
                onUserInput: options.onUserInput || ((prompt: string) => Promise.reject("No user input handler provided")),
                signal: options.signal || abortController.signal,
                timeout: options.timeout || 30000,
                maxRetries: options.maxRetries || 3,
                variables: variables,
                environment: options.environment || (typeof window !== 'undefined' ? 'browser' : 'node')
            });
        }
    };
}
