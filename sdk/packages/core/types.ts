import type { Config, Schema, Node } from "@markdoc/markdoc";

export type AIMConfig = Config & {
    variables: Record<string, any>;
}

export type AIMTag = Schema & {
    runtime: (node: Node, config: Config, {  executeNode }: { executeNode?: (node: Node) => Promise<any> }) => Promise<any>;
}

export interface RuntimeContext {
    stack: Array<{
        id: string;
        variables: Record<string, any>;
    }>;
    data: Record<string, any>;
}

export interface RuntimeOptions {
    config: Config;
    input?: { [key: string]: string | object | number };
    onLog: (message: string) => void;
    onError: (errorMessage: string) => void;
    onSuccess: (successMessage: string) => void;
    onAbort: (abortReason: string) => void;
    onFinish: (finishMessage: string) => void;
    onStart: (startMessage: string) => void;
    onStep: (stepDescription: string) => void;
    onData: (data: unknown) => void;
    onOutput?: (output: {
        success: boolean;
        data?: unknown;
        type: 'text' | 'code' | 'image' | 'structured' | 'error';
        content: string | object;
    }) => Promise<void>;
    onUserInput: (prompt: string) => Promise<string>;
    signal?: AbortSignal;
    timeout?: number;
    maxRetries?: number;
    variables: { [key: string]: string | object | number };
    environment?: "node" | "browser";
    getReferencedFlow?: (flowId: string) => Promise<{ name: string; } | null>;
}
