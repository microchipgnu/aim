import { createAnthropic } from '@ai-sdk/anthropic';
import { createOpenAI } from '@ai-sdk/openai';
import {
  type Config,
  type Node,
  type RenderableTreeNodes,
  type Schema,
  Tag,
} from '@markdoc/markdoc';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { type ToolExecutionOptions, generateObject, generateText } from 'ai';
import { chromeai as chromeAI } from 'chrome-ai';
import { createOllama } from 'ollama-ai-provider';
import { GLOBAL_SCOPE } from '../../aim';
import type { AIMConfig, AIMTool, StateManager } from '../../types';
import { text } from '../renderers/text';

export const aiTag: Schema = {
  render: 'ai',
  selfClosing: true,
  attributes: {
    model: { type: String, required: true, default: 'openai/gpt-4o-mini' },
    id: { type: String, required: false },
    temperature: { type: Number, required: false, default: 0.5 },
    structuredOutputs: { type: Object, required: false, default: undefined },
    tools: { type: String, required: false, default: undefined }, // array of tool names
  },
  transform(node, config) {
    return new Tag(
      'ai',
      node.transformAttributes(config),
      node.transformChildren(config),
    );
  },
};

export async function* ai(
  node: Node,
  config: AIMConfig,
  stateManager: StateManager,
): AsyncGenerator<RenderableTreeNodes> {
  const runtimeState = stateManager.getRuntimeState();
  const signal = runtimeState.options.signals.abort;

  const attrs = node.transformAttributes(config as Config);

  if (signal.aborted) {
    throw new Error('AI execution aborted');
  }

  const contextText = stateManager.getScopedText(GLOBAL_SCOPE).join('\n');
  const modelConfig = parseModelString(attrs.model || 'openai/gpt-4');
  const model = await getAIModel(modelConfig, stateManager);
  const requestedTools = attrs.tools
    ? attrs.tools.split(',').map((t: string) => t.trim())
    : undefined;

  if (!model) {
    throw new Error(`Invalid model configuration: ${attrs.model}`);
  }

  if (signal.aborted) {
    throw new Error('AI execution aborted');
  }

  const allTools = Object.fromEntries(
    Object.entries(runtimeState.options.tools || {}).map(
      ([name, tool]) => [name, tool],
    ),
  );

  const tools: Record<string, AIMTool> =
    attrs.tools === '*'
      ? allTools as Record<string, AIMTool>
      : requestedTools
        ? Object.fromEntries(
            Object.entries(allTools).filter(([name]) =>
              requestedTools.includes(name),
            ),
          ) as Record<string, AIMTool>
        : {};

  for (const [name, tool] of Object.entries(tools || {})) {
    if (tool?.execute) {
      const originalExecute = tool.execute;
      
      tool.execute = async (args: unknown, ...rest: unknown[]) => {
        const options = rest[0] as ToolExecutionOptions;
        const result = await originalExecute(args, options);

        stateManager.addToTextRegistry(
          `${name} called with args: ${JSON.stringify(args)}\nResult: ${JSON.stringify(result)}`,
          GLOBAL_SCOPE,
        );

        return result;
      };
    } else {
      tool.execute = async (args: unknown) => {
        stateManager.runtimeOptions.events?.onToolCall?.(name, args);
      };
    }
  }

  const result = await generateText({
    model,
    prompt: contextText,
    temperature: attrs.temperature || 0.5,
    abortSignal: signal,
    tools: tools || {},
    maxSteps: 10,
  });

  stateManager.addToTextRegistry(text(result.text), GLOBAL_SCOPE);

  let structuredOutputs: any;

  if (attrs.structuredOutputs) {
    if (signal.aborted) {
      throw new Error('AI execution aborted');
    }

    const structuredOutputsRequest = await generateObject({
      model,
      prompt: `Create an object that matches the following schema: ${JSON.stringify(attrs.structuredOutputs)}\n Here is the context: ${stateManager.getScopedText(GLOBAL_SCOPE).join('\n')}`,
      temperature: attrs.temperature || 0.5,
      output: 'no-schema',
      abortSignal: signal,
    });

    structuredOutputs = structuredOutputsRequest.object;

    if (structuredOutputs) {
      stateManager.addToTextRegistry(
        text(JSON.stringify(structuredOutputs)),
        GLOBAL_SCOPE,
      );
    }
  }

  const aiTag = new Tag('ai');

  if (signal.aborted) {
    throw new Error('AI execution aborted');
  }

  stateManager.pushStack({
    id: attrs.id || 'ai',
    scope: GLOBAL_SCOPE,
    variables: {
      result: result.text,
      context: contextText,
      ...(structuredOutputs && { structuredOutputs }),
    },
  });

  aiTag.children.push(result.text);

  yield aiTag;
}

interface ModelConfig {
  provider: string;
  name: string;
  hosting?: string;
  extension?: string;
}

function parseModelString(modelString: string): ModelConfig {
  const [provider, fullModelName = ''] = modelString.split('/');
  const [modelNameWithExtension = '', hosting = ''] = fullModelName.split('@');
  const [modelName, extension = ''] = modelNameWithExtension.split(':');

  return {
    provider,
    name: extension ? `${modelName}:${extension}` : modelName,
    hosting,
    extension,
  };
}

async function getAIModel(config: ModelConfig, stateManager: StateManager) {
  if (config.hosting === 'openrouter') {
    const openRouterClient = createOpenRouter({
      apiKey: stateManager.getSecret('OPENROUTER_API_KEY'),
    });
    return openRouterClient(`${config.provider}/${config.name}`);
  }

  switch (config.provider) {
    case 'openai': {
      const openAIClient = createOpenAI({
        apiKey: stateManager.getSecret('OPENAI_API_KEY'),
      });
      return openAIClient(config.name);
    }
    case 'anthropic': {
      const anthropicClient = createAnthropic({
        apiKey: stateManager.getSecret('ANTHROPIC_API_KEY'),
      });
      return anthropicClient(config.name);
    }
    case 'ollama': {
      const ollamaClient = createOllama({
        baseURL: stateManager.getSecret('OLLAMA_BASE_URL'),
      });
      return ollamaClient(config.name);
    }
    case 'google':
      if (config.name === 'chrome-ai') {
        return chromeAI('text', { temperature: 0.5, topK: 5 });
      }
      throw new Error(`Unsupported Google model: ${config.name}`);
    default:
      throw new Error(`Unsupported model provider: ${config.provider}`);
  }
}

// export const modelProviders = {
// 	openai: [
// 		"gpt-3.5-turbo",
// 		"gpt-4",
// 		"gpt-4-turbo",
// 		"gpt-4-32k",
// 		"gpt-4-1106-preview",
// 		"gpt-4-vision-preview",
// 		"gpt-3.5-turbo-16k",
// 		"gpt-3.5-turbo-instruct",
// 	],
// 	google: [
// 		"gemini-pro",
// 		"gemini-pro-vision",
// 		"text-bison",
// 		"chat-bison",
// 		"code-bison",
// 		"codechat-bison",
// 	],
// 	anthropic: [
// 		"claude-2",
// 		"claude-2.1",
// 		"claude-3-opus",
// 		"claude-3-sonnet",
// 		"claude-3-haiku",
// 		"claude-instant-1",
// 		"claude-instant-1.2",
// 	],
// };

// export const allModels = Object.entries(modelProviders).flatMap(([provider, models]) =>
// 	models.map(model => `${provider}/${model}`)
// );
