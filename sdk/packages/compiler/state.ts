import { createStore, createEvent } from 'effector';
import type { BlockType } from './types';
import type { AIMNode } from './parser';

export interface VariableInfo {
  blockId: string;
  blockType?: BlockType;
}

export interface ParserState {
  variables: Map<string, VariableInfo>;
  blockStack: AIMNode[];
  indentLevel: number;
}

// Events
export const setVariable = createEvent<{ name: string; info: VariableInfo }>();
export const pushBlock = createEvent<AIMNode>();
export const popBlock = createEvent();
export const setIndentLevel = createEvent<number>();
export const resetParserState = createEvent();

// Initial state
const initialState: ParserState = {
  variables: new Map(),
  blockStack: [],
  indentLevel: 0
};

// Store
export const $parserState = createStore<ParserState>(initialState)
  .on(setVariable, (state, { name, info }) => {
    const newVariables = new Map(state.variables);
    newVariables.set(name, info);
    return {
      ...state,
      variables: newVariables
    };
  })
  .on(pushBlock, (state, block) => ({
    ...state,
    blockStack: [...state.blockStack, block]
  }))
  .on(popBlock, (state) => ({
    ...state,
    blockStack: state.blockStack.slice(0, -1)
  }))
  .on(setIndentLevel, (state, level) => ({
    ...state,
    indentLevel: level
  }))
  .reset(resetParserState);

// Derived helpers
export const getCurrentBlock = (): AIMNode | undefined => {
  const state = $parserState.getState();
  return state.blockStack[state.blockStack.length - 1];
};

export const getVariable = (name: string): VariableInfo | undefined => {
  const state = $parserState.getState();
  return state.variables.get(name);
};

export const getAllVariables = (): Map<string, VariableInfo> => {
  const state = $parserState.getState();
  return new Map(state.variables);
};
