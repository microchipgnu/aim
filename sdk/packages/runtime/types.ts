import type { Block } from "@aim-sdk/compiler/types";

export interface RuntimeOptions {
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
        executedBlock: Block;
    }) => Promise<void>;
    onUserInput: (prompt: string) => Promise<string>;
    signal?: AbortSignal;
    timeout?: number;
    maxRetries?: number;
    variables: { [key: string]: string | object | number };
    environment?: "node" | "browser";
    getReferencedFlow?: (flowId: string) => Promise<{ name: string; content: Block[] } | null>;
}

export type BlockExecutor = (block: Block, options: RuntimeOptions, previousBlocks: Block[]) => Promise<string | object | void | number>;