import { type Schema, functions, nodes, tags } from '@markdoc/markdoc';
import * as jsEnvironment from 'browser-or-node';
import {
  add,
  divide,
  multiply,
  subtract,
} from './markdoc/functions/arithmetic';
import {
  greaterThan,
  greaterThanOrEqual,
  includes,
  lessThan,
  lessThanOrEqual,
} from './markdoc/functions/compare';
import { fenceNode } from './markdoc/nodes/fence';
import { parser } from './markdoc/parser';
import { aiTag } from './markdoc/tags/ai';
import { elseTag, ifTag } from './markdoc/tags/conditionals';
import { flowTag } from './markdoc/tags/flow';
import { groupTag } from './markdoc/tags/group';
import { inputTag } from './markdoc/tags/input';
import { loopTag } from './markdoc/tags/loop';
import { mediaTag } from './markdoc/tags/media';
import { parallelTag } from './markdoc/tags/parallel';
import { setTag } from './markdoc/tags/set';
import { execute, executeGenerator } from './runtime/execute';
import { StateManager } from './runtime/state';
import type { AIMPlugin, RuntimeOptions } from './types';

export const GLOBAL_SCOPE = 'global';

export const defaultRuntimeOptions: RuntimeOptions = {
  plugins: [],
  adapters: [],
  variables: {},
  input: {},
  events: {},
  tools: {},
  signals: {
    abort: new AbortController().signal,
  },
  timeout: 50000,
  maxRetries: 5,
  environment: jsEnvironment.isBrowser ? 'browser' : 'node',
  getReferencedFlow: undefined,
  settings: {
    useScoping: false,
  },
  env: {},
  config: {
    variables: {},
    nodes: {
      ...nodes,
      fence: fenceNode,
    },
    tags: {
      ...tags,
      ai: aiTag,
      loop: loopTag,
      set: setTag,
      input: inputTag,
      flow: flowTag,
      if: ifTag,
      else: elseTag,
      media: mediaTag,
      group: groupTag,
      parallel: parallelTag,
    },
    functions: {
      ...functions,
      greaterThan,
      lessThan,
      greaterThanOrEqual,
      lessThanOrEqual,
      includes,
      add,
      subtract,
      multiply,
      divide,
    },
  },
};

export function aim({
  content,
  options = defaultRuntimeOptions,
  manager,
}: { content: string; options: RuntimeOptions; manager?: StateManager }) {
  const stateManager =
    manager ||
    new StateManager(
      {
        ...options.config,
        variables: {
          ...options.config.variables,
        },
      },
      options,
    );

  stateManager.setSecrets(options.env || {});

  // Register plugins in state
  if (options.plugins) {
    for (const p of options.plugins) {
      stateManager.registerPlugin(p.plugin, p.options);
    }
  }

  if (options.adapters) {
    for (const adapter of options.adapters) {
      stateManager.registerAdapter(adapter);
    }
  }

  // Convert plugins to Markdoc tags
  const pluginsConvertedToMarkdocTags: Record<string, Schema> =
    options.plugins?.reduce((acc: Record<string, Schema>, p: { plugin: AIMPlugin, options: unknown }) => {
      const tags = Object.entries(p.plugin.tags || {}).reduce(
        (filtered, [key, tag]) => {
          const { runtime, ...tagWithoutRuntime } = tag as any;
          return {
            ...filtered,
            [`${p.plugin.name}_${key}`]: tagWithoutRuntime,
          };
        },
        {},
      );
      return {
        ...acc,
        ...tags,
      };
    }, {}) || {};

  const runtimeOptions = {
    ...defaultRuntimeOptions,
    ...options,
    config: {
      ...defaultRuntimeOptions.config,
      ...options.config,
      tags: {
        ...defaultRuntimeOptions.config.tags,
        ...pluginsConvertedToMarkdocTags,
      },
    },
    events: {
      ...defaultRuntimeOptions.events,
      ...options.events,
    },
  };

  stateManager.$runtimeState.next({
    ...stateManager.getRuntimeState(),
    options: runtimeOptions,
  });

  const { ast, validation, frontmatter } = parser(content, runtimeOptions);

  const warnings = validation.map((error) => ({
    ...error,
    error: {
      ...error.error,
      level:
        error.error?.id === 'variable-undefined'
          ? 'warning'
          : error.error?.level,
    },
  }));

  const errors = validation.filter(
    (error) =>
      error.error?.level === 'error' &&
      error.error?.id !== 'variable-undefined',
  );

  return {
    ast,
    frontmatter,
    errors: errors,
    warnings: warnings,
    runtimeOptions,
    stateManager,
    execute: async (variables?: Record<string, any>) => {
      // Get input variables from document frontmatter
      const inputVariables = frontmatter?.input || [];
      const resolvedVariables: Record<string, any> = {};

      // First try to get values from passed variables, then options.input or options.variables
      const inputValues =
        variables || runtimeOptions.input || runtimeOptions.variables || {};

      // Map input variables using provided values or defaults from schema
      for (const variable of inputVariables) {
        const value = inputValues[variable.name];
        resolvedVariables[variable.name] = value ?? variable.schema?.default;
      }

      // Create a nested input object for frontmatter access
      const inputObject = {
        ...inputValues, // Include all input values directly
      };

      if (Object.keys(inputObject).length > 0) {
        stateManager.pushStack({
          id: 'frontmatter',
          variables: {
            ...inputObject,
          },
          scope: GLOBAL_SCOPE,
        });
      }

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(
          () => reject(new Error('Execution timed out')),
          runtimeOptions.timeout,
        );
      });

      const abortPromise = new Promise((_, reject) => {
        runtimeOptions.signals.abort.addEventListener('abort', () =>
          reject(new Error('Execution aborted')),
        );
      });

      await Promise.race([
        execute({
          node: ast,
          stateManager: stateManager as any,
        }),
        timeoutPromise,
        abortPromise,
      ]);
    },
    executeWithGenerator: async function* (variables?: Record<string, any>) {
      // Get input variables from document frontmatter
      const inputVariables = frontmatter?.input || [];
      const resolvedVariables: Record<string, any> = {};

      // First try to get values from passed variables, then options.input or options.variables
      const inputValues =
        variables || runtimeOptions.input || runtimeOptions.variables || {};

      // Map input variables using provided values or defaults from schema
      for (const variable of inputVariables) {
        const value = inputValues[variable.name];
        resolvedVariables[variable.name] = value ?? variable.schema?.default;
      }

      // Create a nested input object for frontmatter access
      const inputObject = {
        ...inputValues, // Include all input values directly
      };

      if (Object.keys(inputObject).length > 0) {
        stateManager.pushStack({
          id: 'frontmatter',
          variables: {
            ...inputObject,
          },
          scope: GLOBAL_SCOPE,
        });
      }

      const generator = executeGenerator({
        node: ast,
        stateManager: stateManager,
      });

      const timeoutId = setTimeout(() => {
        generator.throw(new Error('Execution timed out'));
      }, runtimeOptions.timeout);

      try {
        for await (const result of generator) {
          if (runtimeOptions.signals.abort.aborted) {
            throw new Error('Execution aborted');
          }
          yield result;
        }
      } finally {
        clearTimeout(timeoutId);
      }
    },
  };
}
