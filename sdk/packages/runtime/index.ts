import { compile } from "@aim-sdk/compiler";
import { execute } from "./clients";
import type { RuntimeOptions } from "./types";

export async function aim(strings: TemplateStringsArray, ...values: any[]) {
    const text = strings.reduce((result, str, i) =>
        result + str + (values[i] || ''),
        '');

    const { document, errors } = await compile(text);

    if(document.frontmatter?.execute === false) {
        return {
            document,
            errors: errors,
            warnings: [],
            execute: async (options: Partial<RuntimeOptions> = {}) => {
                return Promise.resolve();
            }
        }
    }

    return {
        document,
        errors: errors,
        warnings: [],
        execute: async (options: Partial<RuntimeOptions> = {}) => {
            const abortController = new AbortController();
            
            // Get input variables from document frontmatter
            const inputVariables = document.frontmatter?.input || [];
            const variables: Record<string, any> = {};

            // First try to get values from options.input or options.variables
            const inputValues = options.input || options.variables || {};

            // Map input variables using provided values or defaults from schema
            for (const variable of inputVariables) {
                const value = inputValues[variable.name];
                variables[variable.name] = value ?? variable.schema?.default;
            }
            
            return execute(document.blocks, {
                onLog: options.onLog || (() => {}),
                onError: options.onError || (() => {}),
                onSuccess: options.onSuccess || (() => {}),
                onAbort: options.onAbort || (() => {}),
                onFinish: options.onFinish || (() => {}),
                onStart: options.onStart || (() => {}),
                onStep: options.onStep || (() => {}),
                onData: options.onData || (() => {}),
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
