import { type Config } from "@markdoc/markdoc";
import { createEffect, createEvent, createStore } from 'effector';
import type { AIMAdapter, AIMConfig, AIMPlugin, RuntimeContext, StateBlock } from "types";

// Events
const events = {
    pushStack: createEvent<{
        id: string;
        scope: string;
        variables: Record<string, any>;
    }>(),
    popStack: createEvent<{ scope: string }>(),
    setData: createEvent<{ data: Record<string, any>, scope: string }>(),
    resetContext: createEvent(),
    addToTextRegistry: createEvent<{ text: string; scope: string }>(),
    clearTextRegistry: createEvent<{ scope: string }>(),
    registerPlugin: createEvent<{ plugin: AIMPlugin, options?: unknown }>(),
    registerAdapter: createEvent<AIMAdapter>(),
    updateState: createEvent<RuntimeContext>()
};

export const {
    pushStack,
    popStack,
    setData,
    resetContext,
    addToTextRegistry,
    clearTextRegistry,
    registerPlugin,
    registerAdapter,
    updateState
} = events;

const validatePlugin = (plugin: AIMPlugin, state: RuntimeContext) => {
    const plugins = new Map(state.plugins);

    if (plugins.has(plugin.name)) {
        throw new Error(`Plugin ${plugin.name} is already registered`);
    }

    if (plugin.dependencies?.plugins) {
        for (const dep of plugin.dependencies.plugins) {
            if (!plugins.get(dep.name)) {
                throw new Error(`Plugin ${plugin.name} requires ${dep.name}, but it's not registered`);
            }
        }
    }

    if (plugin.dependencies?.adapters) {
        for (const dep of plugin.dependencies.adapters) {
            if (!state.adapters.get(dep.name)) {
                throw new Error(`Plugin ${plugin.name} requires adapter ${dep.name}, but it's not registered`);
            }
        }
    }
};

const mergePluginConfig = (plugin: AIMPlugin, currentConfig: AIMConfig): AIMConfig => {
    const newConfig = { ...currentConfig };

    if (plugin.tags) {
        newConfig.tags = { ...newConfig.tags, ...plugin.tags };
    }

    if (plugin.functions) {
        const pluginFunctions = Object.fromEntries(
            Object.entries(plugin.functions).map(([key, fn]) => [key, fn])
        );
        newConfig.functions = { ...newConfig.functions, ...pluginFunctions };
    }

    return newConfig;
};
// State history chain store
export const $stateChain = createStore<StateBlock[]>([])
    .on(updateState, (state, newState) => {

        const updatedState = [...state];

        updatedState.push(createStateBlock(
            state[state.length - 1]?.state || newState, 
            newState, 
            'updateState', 
            
        ));

        return updatedState;
    });


const createStateBlock = (prevState: RuntimeContext, newState: RuntimeContext, action: string): StateBlock => ({
    timestamp: Date.now(),
    action,
    hash: crypto.randomUUID(), // Unique identifier for the block
    previousHash: $stateChain.getState().at(-1)?.hash || "genesis",
    state: newState,
    diff: {
        stack: newState.stack.length - prevState.stack.length,
        textRegistry: Object.keys(newState.textRegistry).length - Object.keys(prevState.textRegistry).length,
        data: Object.keys(newState.data).length - Object.keys(prevState.data).length
    }
});

// Store with explicit type for update handlers
export const $runtimeContext = createStore<RuntimeContext>({
    stack: [],
    data: {},
    plugins: new Map(),
    adapters: new Map(),
    config: {} as AIMConfig,
    textRegistry: {},
})
    .on(pushStack, (state, stackFrame) => {
        const newState = {
            ...state,
            stack: [...state.stack, stackFrame],
            currentScope: stackFrame.scope
        };

        return newState;
    })
    .on(registerPlugin, (state, { plugin, options }) => {
        validatePlugin(plugin, state);

        const plugins = new Map(state.plugins);

        if (plugin.init) {
            plugin.init(state.config, options);
        }

        plugins.set(plugin.name, plugin);
        const newConfig = mergePluginConfig(plugin, state.config);
        const newState = {
            ...state,
            plugins,
            config: newConfig
        };


        return newState;
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
        const newState = {
            ...state,
            adapters
        };


        return newState;
    })
    .on(addToTextRegistry, (state, { text, scope }) => {
        const newState = {
            ...state,
            textRegistry: {
                ...state.textRegistry,
                [scope]: [...(state.textRegistry[scope] || []), text]
            }
        };


        return newState;
    })
    .on(clearTextRegistry, (state, { scope }) => {
        const newRegistry = { ...state.textRegistry };
        delete newRegistry[scope];
        const newState = { ...state, textRegistry: newRegistry };


        return newState;
    })
    .on(popStack, (state, { scope }) => {
        const newStack = state.stack.filter(frame => frame.scope !== scope);
        const newState = {
            ...state,
            stack: newStack,
            textRegistry: state.textRegistry,
            data: state.data,
            plugins: state.plugins,
            adapters: state.adapters,
            config: state.config
        };


        return newState;
    })
    .on(setData, (state, { data, scope }) => {
        const newState = {
            ...state,
            data: {
                ...state.data,
                [scope]: {
                    ...(state.data[scope] || {}),
                    ...data
                }
            }
        };


        return newState;
    })
    .reset(resetContext);

// State history helpers
export const getStateHistory = () => $stateChain.getState();

export const getStateAtBlock = (hash: string) => {
    const block = $stateChain.getState().find(b => b.hash === hash);
    return block?.state;
};

// Scope helpers
export const getScopedVariables = (scope: string) => {
    const state = $runtimeContext.getState();
    return state.data[scope] || {};
};

export const getScopedText = (scope: string) => {
    const state = $runtimeContext.getState();
    return state.textRegistry[scope] || [];
};

export const getCurrentScopeVariables = getScopedVariables;
export const getCurrentScopeText = getScopedText;

export const clearScope = (scope: string) => {
    setData({ data: {}, scope });
};

// Config processing
const processScopedVariables = (stack: RuntimeContext['stack']) => {
    const scopedVariables: Record<string, Record<string, any>> = {};

    for (const frame of stack) {
        if (!scopedVariables[frame.scope]) {
            scopedVariables[frame.scope] = {};
        }

        scopedVariables[frame.scope][frame.id] = {
            ...scopedVariables[frame.scope][frame.id],
            ...frame.variables
        };
    }

    const stackVariables: Record<string, any> = {};
    Object.values(scopedVariables).forEach(scopeVars => {
        Object.assign(stackVariables, scopeVars);
    });

    return stackVariables;
};

// Effects
export const getCurrentConfigFx = createEffect((config: Config): Config => {
    const state = $runtimeContext.getState();
    const stackVariables = processScopedVariables(state.stack);

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


$runtimeContext.watch(async (state) => {
    updateState(state);
});