import type {
	Config,
	Node,
	RenderableTreeNodes,
	Schema,
} from "@markdoc/markdoc";
import type { CoreTool } from "ai";
import type { StructuredTool } from "langchain/tools";
import type { StateManager } from "runtime/state";
import type { z } from "zod";

export type StateBlock = {
	timestamp: number;
	action: string;
	hash: string;
	previousHash: string;
	state: RuntimeContext;
	diff: {
		stack: number;
		textRegistry: number;
		data: number;
	};
};

export type AIMConfig = Config;

export type AIMTag = Schema;

export type StackFrame = {
	/** Unique identifier for the stack frame */
	id: string;
	/** Scope for the stack frame */
	scope: string;
	/** Variables stored in this stack frame */
	variables: Record<string, any>;
};

export type RuntimeMethods = {
	/** Add a new frame to the execution stack */
	pushStack: (frame: {
		id: string;
		scope: string;
		variables: Record<string, any>;
	}) => void;
	/** Remove frames from the execution stack for a given scope */
	popStack: (params: { scope: string }) => void;
	/** Set data in the scoped store */
	setData: (params: { data: Record<string, any>; scope: string }) => void;
	/** Reset the runtime context to initial state */
	resetContext: () => void;
	/** Add text to the registry for AI context */
	addToTextRegistry: (params: { text: string; scope: string }) => void;
	/** Clear the text registry for a scope */
	clearTextRegistry: (params: { scope: string }) => void;
	/** Get current config with resolved variables */
	getCurrentConfig: (config: Config) => Promise<Config>;
	/** Get the current runtime context */
	getRuntimeContext: () => Promise<RuntimeContext>;
};

export type RuntimeContext = {
	/** Text registry for AI context, scoped by key */
	textRegistry: Record<string, string[]>;
	/** Stack of execution frames */
	stack: Array<StackFrame>;
	/** Global data store, scoped by key */
	data: Record<string, Record<string, any>>;
	/** Registered plugins */
	plugins: Map<string, AIMPlugin>;
	/** Registered adapters */
	adapters: Map<string, AIMAdapter>;
	/** Current configuration */
	config: AIMConfig;
};

export type RuntimeState = {
	/** Runtime options for execution */
	options: RuntimeOptions;
	/** Current runtime context state */
	context: RuntimeContext & {
		methods: RuntimeMethods;
	};
};

export type AIMRuntime = {
	/** Current Markdoc node being processed */
	node: Node;
	/** Runtime state and execution context */
	stateManager: StateManager;
};

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
			type: "text" | "code" | "image" | "structured" | "error";
			content: string | object;
		}) => Promise<void>;
		onUserInput?: (prompt: string) => Promise<string>;
	};
	signals: {
		abort: AbortSignal;
	};
	settings: {
		useScoping: boolean;
	};
	env?: Record<string, string>;
	timeout?: number;
	maxRetries?: number;
	variables?: Record<string, unknown>;
	environment?: "node" | "browser";
	getReferencedFlow?: (flowId: string) => Promise<{ name: string } | null>;
	plugins?: Array<{ plugin: AIMPlugin; options?: unknown }>;
	adapters?: Array<AIMAdapter>;
	tools?: Record<string, StructuredTool | CoreTool | AIMTool>;
	experimental_files?: Record<string, {
		content: string;
	}>;
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
	type: "text" | "code" | "image" | "structured" | "error";
	content: string | object;
}

export interface AIMAdapter {
	type: string;
	name: string;
	init?: () => void;
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
	init?: (config: AIMConfig, pluginOptions?: unknown) => void;
	tags?: Record<
		string,
		AIMTag & {
			execute: (params: {
				node: Node;
				config: Config;
				state: RuntimeState;
			}) => AsyncGenerator<RenderableTreeNodes>;
		}
	>;
	functions?: Record<string, (...args: any[]) => any>;
	hooks?: {
		beforeExecution?: (context: RuntimeContext) => Promise<void>;
		afterExecution?: (context: RuntimeContext, result: any) => Promise<void>;
		onError?: (context: RuntimeContext, error: Error) => Promise<void>;
	};
}


export type AIMTool = {
	description: string;
	parameters: z.ZodObject<any>;
	execute: (args: any) => Promise<any>;
}
