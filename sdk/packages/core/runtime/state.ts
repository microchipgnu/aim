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

// Store
export const $runtimeContext = createStore<RuntimeContext>({
    stack: [],
    data: {}
});

// Update handlers
$runtimeContext
    .on(pushStack, (state, stackFrame) => ({
        ...state,
        stack: [...state.stack, stackFrame]
    }))
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
