import { createOpenAI } from "@ai-sdk/openai"
import { getEnvValue } from "../envs"
import { createAnthropic } from "@ai-sdk/anthropic"
import { createOllama } from "ollama-ai-provider"
import { chromeai as chromeAI } from "chrome-ai"
import { createOpenRouter } from '@openrouter/ai-sdk-provider';

export const openai = createOpenAI({
    apiKey: getEnvValue("OPENAI_API_KEY"),
});

export const anthropic = createAnthropic({
    apiKey: getEnvValue("ANTHROPIC_API_KEY"),
});

export const ollama = createOllama({
    baseURL: getEnvValue("OLLAMA_BASE_URL"),
});

export const openrouter = createOpenRouter({
    apiKey: getEnvValue("OPENROUTER_API_KEY"),
});


export const chromeai = chromeAI


export const modelProviders = [
    { provider: 'openai', models: ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo', 'gpt-4-32k', 'gpt-4-1106-preview', 'gpt-4-vision-preview', 'gpt-3.5-turbo-16k', 'gpt-3.5-turbo-instruct'] },
    { provider: 'google', models: ['gemini-pro', 'gemini-pro-vision', 'text-bison', 'chat-bison', 'code-bison', 'codechat-bison'] },
    { provider: 'anthropic', models: ['claude-2', 'claude-2.1', 'claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku', 'claude-instant-1', 'claude-instant-1.2'] },
];