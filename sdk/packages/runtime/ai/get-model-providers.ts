// Implements CAIMPS (https://github.com/microchipgnu/caimps) and maps to providers used by Vercel AI SDK

import { anthropic, chromeai, modelProviders, ollama, openai, openrouter } from "./config";

export const getModelProvider = (model: string): any => {
    const [provider, modelName] = model.split('/');
    const hosting = getModelHosting(model);

    if (hosting === 'openrouter') {
        return openrouter(`${provider}/${modelName}`);
    }

    switch (provider) {
        case 'openai':
            return openai(modelName);
        case 'ollama':
            return ollama(modelName);
        case 'google':
            if (modelName === 'chrome-ai@chrome') {
                return chromeai("text", { temperature: 0.5, topK: 5 });
            }
            // Add other Google models as needed
            break;
        case 'anthropic':
            return anthropic(modelName);
        default:
            throw new Error(`Unknown model provider: ${provider}`);
    }
};

export const allModels = modelProviders.flatMap(provider => 
    provider.models.map(model => `${provider.provider}/${model}`)
);

export const getModelName = (fullModelName: string): string => {
    const [, modelName] = fullModelName.split('/');
    return modelName || fullModelName;
};

export const getProviderName = (fullModelName: string): string => {
    const [providerName] = fullModelName.split('/');
    return providerName || 'unknown';
};

export const getModelHosting = (fullModelName: string): string => {
    const [provider, modelName] = fullModelName.split('/');
    if (provider === 'ollama') return 'local';
    if (modelName?.includes('@')) {
        const [, host] = modelName.split('@');
        return host;
    }
    if (modelName?.includes('openrouter')) return 'openrouter';
    return 'cloud';
};
