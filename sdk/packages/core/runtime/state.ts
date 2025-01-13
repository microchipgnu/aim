import { type Config } from "@markdoc/markdoc";
import { createEffect, createEvent, createStore } from 'effector';
import type { RuntimeContext } from "types";

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

// Store with explicit type for update handlers
export const $runtimeContext = createStore<RuntimeContext>({
    stack: [],
    data: {}
})
    .on(pushStack, (state, stackFrame) => ({
        ...state,
        stack: [...state.stack, stackFrame]
    } as RuntimeContext));

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

// Add new store for text registry
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
