import { aim, defaultRuntimeOptions } from './aim';
import { html } from './markdoc/renderers/html';
import { react, reactStatic } from './markdoc/renderers/react';
import { text } from './markdoc/renderers/text';
import { baseEnvVars } from './runtime/envs/default';
import { process } from './runtime/process';
import { createStateManager } from './runtime/state';

// Export Zod schemas for validation
import * as schemas from './schemas';
import { validate, validateSafe, validateWithResult } from './validation';

export { aim, process, createStateManager, baseEnvVars, defaultRuntimeOptions, schemas, validate, validateSafe, validateWithResult };

export const renderers = {
  html,
  react,
  reactStatic,
  text,
} as const;

// Type exports
export type {
  AIMConfig,
  AIMTag,
  AIMPlugin,
  AIMAdapter,
  AIMTool,
  AIMResult,
  AIMOutput,
  RuntimeOptions,
  RuntimeContext,
  RuntimeState,
  StackFrame,
  StateBlock,
} from './types';
