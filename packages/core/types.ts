import type {
  Schema,
} from '@markdoc/markdoc';

// Re-export types from schemas.ts
import type {
  StackFrame,
  StateBlock,
  RuntimeContext,
  RuntimeMethods,
  RuntimeState,
  AIMOutput,
  AIMConfig,
  AIMAdapter,
  AIMPlugin,
  AIMTool,
  RuntimeOptions,
  AIMResult,
  AIMRuntime,
  RenderableTreeNodes,
  Node,
} from './schemas';
import type { StateManager } from './runtime/state';

export type AIMTag = Schema;

// Re-export the types
export type {
  AIMConfig,
  StackFrame,
  StateBlock,
  RuntimeContext,
  RuntimeMethods,
  RuntimeState,
  AIMOutput,
  AIMAdapter,
  AIMPlugin,
  AIMTool,
  RuntimeOptions,
  AIMResult,
  RenderableTreeNodes,
  StateManager,
  AIMRuntime,
  Node,
};
