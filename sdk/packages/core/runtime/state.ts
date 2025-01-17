import { type Config, type ConfigFunction } from "@markdoc/markdoc";
import { createEffect, createEvent, createStore } from 'effector';
import type { RuntimeContext, AIMPlugin, AIMAdapter, AIMConfig } from "types";

// Events
export const pushStack = createEvent<{
    id: string;
    variables: Record<string, any>;
}>();

export const popStack = createEvent();
export const setData = createEvent<Record<string, any>>();
export const resetContext = createEvent();
export const addToTextRegistry = createEvent<string>();
export const clearTextRegistry = createEvent();
export const registerPlugin = createEvent<{plugin: AIMPlugin, options?: unknown}>();
export const registerAdapter = createEvent<AIMAdapter>();

// Store with explicit type for update handlers
export const $runtimeContext = createStore<RuntimeContext>({
    stack: [],
    data: {},
    plugins: new Map(),
    adapters: new Map(),
    config: {} as AIMConfig,
    textRegistry: []
})
    .on(pushStack, (state, stackFrame) => ({
        ...state,
        stack: [...state.stack, stackFrame]
    } as RuntimeContext))
    .on(registerPlugin, (state, {plugin, options}) => {
        const plugins = new Map(state.plugins);
        
        // Validate plugin name uniqueness
        if (plugins.has(plugin.name)) {
            throw new Error(`Plugin ${plugin.name} is already registered`);
        }

        // Check plugin dependencies
        if (plugin.dependencies?.plugins) {
            for (const dep of plugin.dependencies.plugins) {
                const requiredPlugin = plugins.get(dep.name);
                if (!requiredPlugin) {
                    throw new Error(`Plugin ${plugin.name} requires ${dep.name}, but it's not registered`);
                }
            }
        }

        // Check adapter dependencies
        if (plugin.dependencies?.adapters) {
            for (const dep of plugin.dependencies.adapters) {
                const requiredAdapter = state.adapters.get(dep.name);
                if (!requiredAdapter) {
                    throw new Error(`Plugin ${plugin.name} requires adapter ${dep.name}, but it's not registered`);
                }
            }
        }

        // Initialize plugin
        if (plugin.init) {
            plugin.init(state.config, options);
        }

        plugins.set(plugin.name, plugin);

        // Merge plugin tags and functions into config
        const newConfig = {...state.config};
        if (plugin.tags) {
            newConfig.tags = { ...newConfig.tags, ...plugin.tags };
        }
        
        if (plugin.functions) {
            newConfig.functions = { ...newConfig.functions, ...Object.fromEntries(
                Object.entries(plugin.functions).map(([key, fn]) => [key, fn as ConfigFunction])
            )};
        }

        return {
            ...state,
            plugins,
            config: newConfig
        };
    })
    .on(registerAdapter, (state, adapter) => {
        const adapters = new Map(state.adapters);
        
        if (adapters.has(adapter.name)) {
            throw new Error(`Adapter ${adapter.name} is already registered`);
        }

        if (adapter.init) {
            adapter.init();
        }

        adapters.set(adapter.name, adapter);

        return {
            ...state,
            adapters
        };
    })
    .on(addToTextRegistry, (state, text) => ({
        ...state,
        textRegistry: state.textRegistry ? [...state.textRegistry, text] : [text],
        text: text
    }))
    .on(clearTextRegistry, (state) => ({
        ...state,
        textRegistry: []
    }));

// Update handlers
$runtimeContext
    .on(popStack, (state) => ({
        ...state,
        stack: state.stack.slice(0, -1)
    }))
    .on(setData, (state, data) => ({
        ...state,
        data: {
            ...state.data,
            ...data
        }
    }))
    .reset(resetContext);

// Add new store for text registry (kept for backwards compatibility)
export const $textRegistry = createStore<string[]>([])
    .on(addToTextRegistry, (state, text) => [...state, text])
    .reset(clearTextRegistry);

// Effects
export const getCurrentConfigFx = createEffect((config: Config): Config => {
    const state = $runtimeContext.getState();
    const stackVariables: Record<string, any> = {};

    for (const frame of state.stack) {
        stackVariables[frame.id] = frame.variables;
    }

    return {
        ...config,
        variables: {
            ...config.variables,
            ...stackVariables
        }
    };
});

export const getRuntimeContextFx = createEffect((): RuntimeContext => {
    return $runtimeContext.getState();
});
