import { aim } from './aim';
import { html } from './markdoc/renderers/html';
import { react, reactStatic } from './markdoc/renderers/react';
import { text } from './markdoc/renderers/text';
import { baseEnvVars } from './runtime/envs/default';
import { process } from './runtime/process';
import { createStateManager } from './runtime/state';

export { aim, process, createStateManager, baseEnvVars };

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
} from './types';
