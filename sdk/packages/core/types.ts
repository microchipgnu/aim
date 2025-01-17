import type { Config, Schema, Node } from "@markdoc/markdoc";

export type AIMConfig = Config & {
    variables: Record<string, any>;
}
export type AIMTag = Schema & {
    /**
     * Runtime execution function for the tag
     * @param runtime Runtime arguments and context
     * @returns Promise resolving to the tag's execution result
     */
    runtime: (runtime: AIMRuntime) => Promise<unknown>;
}

export type StackFrame = {
    /** Unique identifier for the stack frame */
    id: string;
    /** Variables stored in this stack frame */
    variables: Record<string, unknown>;
}

export type RuntimeMethods = {
    /** Add a new frame to the execution stack */
    pushStack: (frame: StackFrame) => Promise<void>;
    /** Remove the top frame from the execution stack */
    popStack: () => Promise<void>;
    /** Set data in the global store */
    setData: (data: Record<string, unknown>) => Promise<void>;
    /** Reset the runtime context to initial state */
    resetContext: () => Promise<void>;
    /** Add text to the registry for AI context */
    addToTextRegistry: (text: string) => Promise<void>;
    /** Clear the text registry */
    clearTextRegistry: () => Promise<void>;
    /** Get current config with resolved variables */
    getCurrentConfig: (config: Config) => Promise<Config>;
    /** Get the current runtime context */
    getRuntimeContext: () => Promise<RuntimeContext>;
}

export type RuntimeContext = {
    /** Text registry for AI context */
    textRegistry: Array<string>;
    /** Stack of execution frames */
    stack: Array<StackFrame>;
    /** Global data store */
    data: Record<string, unknown>;
    /** Registered plugins */
    plugins: Map<string, AIMPlugin>;
    /** Registered adapters */
    adapters: Map<string, AIMAdapter>;
    /** Current configuration */
    config: AIMConfig;
}

export type RuntimeState = {
    /** Runtime options for execution */
    options: RuntimeOptions;
    /** Current runtime context state */
    context: RuntimeContext & {
        methods: RuntimeMethods;
    };
}

export type AIMRuntime = {
    /** Current Markdoc node being processed */
    node: Node;
    /** Markdoc configuration */
    config: Config;
    /** Runtime state and execution context */
    execution: {
        runtime: RuntimeState;
        /** Function to execute a node with given config and context */
        executeNode: (runtime: AIMRuntime) => Promise<unknown>;
    }
}

export interface RuntimeOptions {
    config: Config;
    input?: { [key: string]: string | object | number };
    events?: {
        onLog?: (message: string) => void;
        onError?: (errorMessage: string) => void;
        onSuccess?: (successMessage: string) => void;
        onAbort?: (abortReason: string) => void;
        onFinish?: (finishMessage: string) => void;
        onStart?: (startMessage: string) => void;
        onStep?: (stepDescription: string) => void;
        onData?: (data: unknown) => void;
        onOutput?: (output: {
            success: boolean;
            data?: unknown;
            type: 'text' | 'code' | 'image' | 'structured' | 'error';
            content: string | object;
        }) => Promise<void>;
        onUserInput?: (prompt: string) => Promise<string>;
    };
    signal?: AbortSignal;
    timeout?: number;
    maxRetries?: number;
    variables?: Record<string, unknown>;
    environment?: "node" | "browser";
    getReferencedFlow?: (flowId: string) => Promise<{ name: string; } | null>;
    plugins?: Array<{plugin: AIMPlugin, options?: unknown}>;
    adapters?: Array<AIMAdapter>;
}


export interface AIMResult {
    ast: Node;
    errors: any[];
    warnings: any[];
    execute: (options: Partial<RuntimeOptions>) => Promise<any>;
}

export interface AIMOutput {
    success: boolean;
    data?: unknown;
    type: 'text' | 'code' | 'image' | 'structured' | 'error';
    content: string | object;
}

export interface AIMAdapter {
    type: string;
    name: string;
    init?: () => Promise<void>;
    handlers: Record<string, (...args: any[]) => Promise<any>>;
}

export interface AIMPlugin {
    name: string;
    version: string;
    description?: string;
    author?: string;
    license?: string;
    dependencies?: {
        plugins?: Array<{ name: string; versionRange: string }>;
        adapters?: Array<{ name: string; versionRange: string }>;
    };
    configSchema?: unknown; // Schema validation object (e.g., Zod, Joi, etc.)
    init?: (config: AIMConfig, pluginOptions?: unknown) => Promise<void>;
    tags?: Record<string, AIMTag>;
    functions?: Record<string, (...args: any[]) => any>;
    hooks?: {
        beforeExecution?: (context: RuntimeContext) => Promise<void>;
        afterExecution?: (context: RuntimeContext, result: any) => Promise<void>;
        onError?: (context: RuntimeContext, error: Error) => Promise<void>;
    };
}