import { createStore, createEvent, sample } from 'effector';
import type { Block } from "@aim-sdk/compiler/types";
import { $parserState } from '@aim-sdk/compiler';

interface BlockResult {
  blockId: string;
  result: string | object | void | number;
  timestamp: number;
}

interface RuntimeState {
  blockResults: Map<string, BlockResult>;
  variables: Map<string, any>;
}

// Events
export const setBlockResult = createEvent<{ block: Block; result: string | object | void | number }>();
export const clearBlockResults = createEvent();
export const setVariable = createEvent<{ name: string; value: any }>();
export const clearVariables = createEvent();

// Helpers
const getBlockId = (block: Block): string => {
  return block.id;
};

// Store
const initialState: RuntimeState = {
  blockResults: new Map(),
  variables: new Map()
};

export const $runtimeState = createStore<RuntimeState>(initialState)
  .on(setBlockResult, (state, { block, result }) => {
    const newBlockResults = new Map(state.blockResults);
    const blockId = getBlockId(block);
    newBlockResults.set(blockId, {
      blockId,
      result,
      timestamp: Date.now()
    });
    return {
      ...state,
      blockResults: newBlockResults
    };
  })
  .on(setVariable, (state, { name, value }) => {
    const newVariables = new Map(state.variables);
    newVariables.set(name, value);
    return {
      ...state,
      variables: newVariables
    };
  })
  .reset(clearBlockResults)
  .reset(clearVariables);

// Subscribe to compiler state changes
sample({
  source: $parserState,
  target: $runtimeState,
  fn: (parserState) => ({
    ...initialState,
    variables: new Map(
      Array.from(parserState.variables.entries()).map(([key, info]) => [key, undefined])
    )
  })
});

// Derived helpers
export const getBlockResult = (block: Block): BlockResult | undefined => {
  const state = $runtimeState.getState();
  const blockId = getBlockId(block);
  return state.blockResults.get(blockId);
};

export const getBlockResultById = (blockId: string): BlockResult | undefined => {
  const state = $runtimeState.getState();
  return state.blockResults.get(blockId);
};

export const getAllBlockResults = (): BlockResult[] => {
  const state = $runtimeState.getState();
  return Array.from(state.blockResults.values());
};

export const getVariable = (name: string): any => {
  const state = $runtimeState.getState();
  return state.variables.get(name);
};

export const getAllVariables = (): Map<string, any> => {
  const state = $runtimeState.getState();
  return new Map(state.variables);
};
