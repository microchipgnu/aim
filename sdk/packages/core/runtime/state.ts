import type { Config, ConfigFunction } from "@markdoc/markdoc";
import { BehaviorSubject, Subject } from "rxjs";
import { scan, shareReplay } from "rxjs/operators";
import type {
	AIMAdapter,
	AIMConfig,
	AIMPlugin,
	RuntimeContext,
	RuntimeMethods,
	RuntimeOptions,
	RuntimeState,
	StackFrame,
	StateBlock,
} from "types";
import { getAllEnvVars } from "./envs";

// Create a StateManager class to handle isolated state
export class StateManager {
	private stateChain$ = new BehaviorSubject<StateBlock[]>([]);
	private runtimeContext$ = new BehaviorSubject<RuntimeContext>(null!);
	private runtimeState$ = new BehaviorSubject<RuntimeState>(null!);
	private stateUpdates$ = new Subject<{
		action: string;
		state: RuntimeContext;
	}>();
	private secrets$ = new BehaviorSubject<Record<string, string>>({});

	// Add public accessor for runtimeState$
	public get $runtimeState() {
		return this.runtimeState$;
	}

	constructor(
		initialConfig: AIMConfig,
		public runtimeOptions: RuntimeOptions,
	) {
		// Initialize runtime context
		const initialContext: RuntimeContext = {
			stack: [],
			data: {},
			plugins: new Map(),
			adapters: new Map(),
			config: initialConfig,
			textRegistry: {},
		};

		this.runtimeContext$.next(initialContext);

		// Initialize runtime state with runtimeOptions
		const initialState: RuntimeState = {
			options: {
				...runtimeOptions,
				config: initialConfig,
				settings: {
					...runtimeOptions.settings,
					useScoping: runtimeOptions.settings?.useScoping ?? true,
				},
			},
			context: {
				...initialContext,
				methods: this.createRuntimeMethods(),
			},
		};

		this.runtimeState$.next(initialState);

		// Setup state chain updates
		this.stateUpdates$
			.pipe(
				scan(
					(
						chain: StateBlock[],
						update: { state: RuntimeContext; action: string },
					) => {
						const prevState = chain[chain.length - 1]?.state || initialContext;
						const newBlock = this.createStateBlock(
							prevState,
							update.state,
							update.action,
						);
						return [...chain, newBlock];
					},
					[],
				),
				shareReplay(1),
			)
			.subscribe(this.stateChain$);

		// Initialize secrets from environment variables
		const envVars = getAllEnvVars();
		const secrets: Record<string, string> = {};
		for (const [key, value] of Object.entries(envVars)) {
			secrets[key] = value;
		}
		this.secrets$.next(secrets);
	}

	private createRuntimeMethods(): RuntimeMethods {
		return {
			pushStack: async (frame: StackFrame) => this.pushStack(frame),
			popStack: async ({ scope }: { scope: string }) => this.popStack(scope),
			setData: async ({
				data,
				scope,
			}: { data: Record<string, any>; scope: string }) =>
				this.setData(data, scope),
			resetContext: async () => this.resetContext(),
			addToTextRegistry: async ({
				text,
				scope,
			}: { text: string; scope: string }) =>
				this.addToTextRegistry(text, scope),
			clearTextRegistry: async ({ scope }: { scope: string }) =>
				this.clearTextRegistry(scope),
			getCurrentConfig: async (config: Config) => this.getCurrentConfig(config),
			getRuntimeContext: async () => this.getRuntimeContext(),
		};
	}

	// Secret management methods
	setSecret(key: string, value: string) {
		const currentSecrets = this.secrets$.value;
		this.secrets$.next({
			...currentSecrets,
			[key]: value,
		});
	}

	getSecret(key: string): string | undefined {
		return this.secrets$.value[key];
	}

	setSecrets(secrets: Record<string, string>) {
		this.secrets$.next({
			...this.secrets$.value,
			...secrets,
		});
	}

	getAllSecrets(): Record<string, string> {
		return { ...this.secrets$.value };
	}

	deleteSecret(key: string) {
		const currentSecrets = this.secrets$.value;
		const { [key]: _, ...remainingSecrets } = currentSecrets;
		this.secrets$.next(remainingSecrets);
	}

	clearSecrets() {
		this.secrets$.next({});
	}

	pushStack(frame: StackFrame) {
		const currentContext = this.runtimeContext$.value;
		const existingFrameIndex = currentContext.stack.findIndex(
			(f: { id: string; scope: string }) =>
				f.id === frame.id && f.scope === frame.scope,
		);

		const newStack = [...currentContext.stack];
		if (existingFrameIndex !== -1) {
			newStack[existingFrameIndex] = {
				...newStack[existingFrameIndex],
				variables: {
					...newStack[existingFrameIndex].variables,
					...frame.variables,
				},
			};
		} else {
			newStack.push(frame);
		}

		this.updateContext({ ...currentContext, stack: newStack }, "pushStack");
	}

	popStack(scope: string) {
		const currentContext = this.runtimeContext$.value;
		const newStack = currentContext.stack.filter(
			(frame: { scope: string }) => frame.scope !== scope,
		);
		this.updateContext({ ...currentContext, stack: newStack }, "popStack");
	}

	setData(data: Record<string, any>, scope: string) {
		const currentContext = this.runtimeContext$.value;
		const newData = {
			...currentContext.data,
			[scope]: {
				...(currentContext.data[scope] || {}),
				...data,
			},
		};
		this.updateContext({ ...currentContext, data: newData }, "setData");
	}

	resetContext() {
		const newContext: RuntimeContext = {
			stack: [],
			data: {},
			plugins: new Map(),
			adapters: new Map(),
			config: this.runtimeContext$.value.config,
			textRegistry: {},
		};
		this.updateContext(newContext, "resetContext");
	}

	addToTextRegistry(text: string, scope: string) {
		const currentContext = this.runtimeContext$.value;
		const newRegistry = {
			...currentContext.textRegistry,
			[scope]: [...(currentContext.textRegistry[scope] || []), text],
		};
		this.updateContext(
			{ ...currentContext, textRegistry: newRegistry },
			"addToTextRegistry",
		);
	}

	clearTextRegistry(scope: string) {
		const currentContext = this.runtimeContext$.value;
		const newRegistry = { ...currentContext.textRegistry };
		delete newRegistry[scope];
		this.updateContext(
			{ ...currentContext, textRegistry: newRegistry },
			"clearTextRegistry",
		);
	}

	registerPlugin(plugin: AIMPlugin, options?: unknown) {
		this.validatePlugin(plugin);
		const currentContext = this.runtimeContext$.value;

		if (plugin.init) {
			plugin.init(currentContext.config, options);
		}

		const newPlugins = new Map(currentContext.plugins);
		newPlugins.set(plugin.name, plugin);
		const newConfig = this.mergePluginConfig(plugin, currentContext.config);

		this.updateContext(
			{
				...currentContext,
				plugins: newPlugins,
				config: newConfig,
			},
			"registerPlugin",
		);
	}

	registerAdapter(adapter: AIMAdapter) {
		const currentContext = this.runtimeContext$.value;
		if (currentContext.adapters.has(adapter.name)) {
			throw new Error(`Adapter ${adapter.name} is already registered`);
		}

		if (adapter.init) {
			adapter.init();
		}

		const newAdapters = new Map(currentContext.adapters);
		newAdapters.set(adapter.name, adapter);

		this.updateContext(
			{
				...currentContext,
				adapters: newAdapters,
			},
			"registerAdapter",
		);
	}

	private validatePlugin(plugin: AIMPlugin) {
		const currentContext = this.runtimeContext$.value;
		if (currentContext.plugins.has(plugin.name)) {
			throw new Error(`Plugin ${plugin.name} is already registered`);
		}

		if (plugin.dependencies?.plugins) {
			for (const dep of plugin.dependencies.plugins) {
				if (!currentContext.plugins.get(dep.name)) {
					throw new Error(
						`Plugin ${plugin.name} requires ${dep.name}, but it's not registered`,
					);
				}
			}
		}

		if (plugin.dependencies?.adapters) {
			for (const dep of plugin.dependencies.adapters) {
				if (!currentContext.adapters.get(dep.name)) {
					throw new Error(
						`Plugin ${plugin.name} requires adapter ${dep.name}, but it's not registered`,
					);
				}
			}
		}
	}

	private mergePluginConfig(
		plugin: AIMPlugin,
		currentConfig: AIMConfig,
	): AIMConfig {
		const newConfig = { ...currentConfig };

		if (plugin.tags) {
			newConfig.tags = { ...newConfig.tags, ...plugin.tags };
		}

		if (plugin.functions) {
			const pluginFunctions = Object.fromEntries(
				Object.entries(plugin.functions).map(([key, fn]) => [
					key,
					typeof fn === "function" ? { execute: fn } : fn,
				]),
			) as Record<string, ConfigFunction>;
			newConfig.functions = { ...newConfig.functions, ...pluginFunctions };
		}

		return newConfig;
	}

	private createStateBlock(
		prevState: RuntimeContext,
		newState: RuntimeContext,
		action: string,
	): StateBlock {
		return {
			timestamp: Date.now(),
			action,
			hash: crypto.randomUUID(),
			previousHash: this.stateChain$.value.at(-1)?.hash || "genesis",
			state: newState,
			diff: {
				stack: newState.stack.length - prevState.stack.length,
				textRegistry:
					Object.keys(newState.textRegistry).length -
					Object.keys(prevState.textRegistry).length,
				data:
					Object.keys(newState.data).length -
					Object.keys(prevState.data).length,
			},
		};
	}

	private updateContext(newContext: RuntimeContext, action: string) {
		this.runtimeContext$.next(newContext);
		this.stateUpdates$.next({ action, state: newContext });

		this.runtimeState$.next({
			...this.runtimeState$.value,
			context: {
				...newContext,
				methods: this.createRuntimeMethods(),
			},
		});
	}

	getScopedVariables(scope: string): Record<string, any> {
		return this.runtimeContext$.value.data[scope] || {};
	}

	getScopedText(scope: string): string[] {
		return this.runtimeContext$.value.textRegistry[scope] || [];
	}

	clearScope(scope: string) {
		this.setData({}, scope);
	}

	processScopedVariables(): Record<string, any> {
		const currentContext = this.runtimeContext$.value;
		const scopedVariables: Record<string, Record<string, any>> = {};

		for (const frame of currentContext.stack) {
			if (!scopedVariables[frame.scope]) {
				scopedVariables[frame.scope] = {};
			}

			scopedVariables[frame.scope][frame.id] = {
				...scopedVariables[frame.scope][frame.id],
				...frame.variables,
			};
		}

		const stackVariables: Record<string, any> = {};
		Object.values(scopedVariables).forEach((scopeVars) => {
			Object.assign(stackVariables, scopeVars);
		});

		return stackVariables;
	}

	getCurrentConfig(config: Config): Config {
		const currentConfig = this.runtimeState$.value.options.config;
		const stackVariables = this.processScopedVariables();
		return {
			...config,
			...currentConfig,
			variables: {
				...config.variables,
				...currentConfig.variables,
				...stackVariables,
			},
		};
	}

	getRuntimeState(): RuntimeState {
		return this.runtimeState$.value;
	}

	getRuntimeContext(): RuntimeContext {
		return this.runtimeContext$.value;
	}

	getStateHistory(): StateBlock[] {
		return this.stateChain$.value;
	}

	getStateAtBlock(hash: string): RuntimeContext | undefined {
		return this.stateChain$.value.find((b: { hash: string }) => b.hash === hash)
			?.state;
	}
}

// Export a factory function to create new state managers
export function createStateManager(
	initialConfig: AIMConfig,
	options: RuntimeOptions,
): StateManager {
	return new StateManager(initialConfig, options);
}
