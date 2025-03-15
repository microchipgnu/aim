import type { ConfigFunction } from '@markdoc/markdoc';
import { BehaviorSubject, Subject } from 'rxjs';
import { scan, shareReplay } from 'rxjs/operators';
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
} from '../types';
import { validateWithResult } from '../validation';

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
    // Validate the initial config with our schema
    const configResult = validateWithResult('AIMConfigSchema', initialConfig);
    if (!configResult.success) {
      console.warn(`Initial config validation warning: ${configResult.error}`);
      // We'll still continue as the config might have additional custom properties
    }

    // Validate runtime options
    const optionsResult = validateWithResult('RuntimeOptionsSchema', runtimeOptions);
    if (!optionsResult.success) {
      console.warn(`Runtime options validation warning: ${optionsResult.error}`);
      // We'll still continue as the options might have additional custom properties
    }

    // Initialize runtime context
    const initialContext: RuntimeContext = {
      stack: [],
      data: {},
      plugins: new Map(),
      adapters: new Map(),
      textRegistry: {},
      config: initialConfig,
    };

    // Create runtime methods
    const methods = this.createRuntimeMethods();

    // Create runtime state
    const runtimeState: RuntimeState = {
      options: runtimeOptions,
      context: {
        ...initialContext,
        methods,
      },
    };

    // Initialize subjects
    this.runtimeContext$.next(initialContext);
    this.runtimeState$.next(runtimeState);

    // Setup state updates subscription
    this.stateUpdates$
      .pipe(
        scan(
          (chain, update) => {
            const prevState =
              chain.length > 0
                ? chain[chain.length - 1].state
                : initialContext;
            const block = this.createStateBlock(
              prevState,
              update.state,
              update.action,
            );
            return [...chain, block];
          },
          [] as StateBlock[],
        ),
        shareReplay(1),
      )
      .subscribe(this.stateChain$);

    // Initialize secrets from environment variables
    const envVars = runtimeOptions.env || {};
    const secrets: Record<string, string> = {};
    for (const [key, value] of Object.entries(envVars)) {
      if (typeof value === 'string') {
        secrets[key] = value;
      }
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
      getCurrentConfig: async (config: AIMConfig) => this.getCurrentConfig(config),
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
    // Validate stack frame
    const frameResult = validateWithResult('StackFrameSchema', frame);
    if (!frameResult.success) {
      throw new Error(`Invalid stack frame: ${frameResult.error}`);
    }

    const currentContext = this.runtimeContext$.value;
    const existingFrameIndex = currentContext.stack.findIndex(
      (f: { id: string }) => f.id === frame.id,
    );

    let updatedStack;
    if (existingFrameIndex >= 0) {
      updatedStack = [...currentContext.stack];
      updatedStack[existingFrameIndex] = frame;
    } else {
      updatedStack = [...currentContext.stack, frame];
    }

    const newContext = {
      ...currentContext,
      stack: updatedStack,
    };

    this.updateContext(newContext, `pushStack:${frame.id}`);
  }

  popStack(scope: string) {
    const currentContext = this.runtimeContext$.value;
    const newStack = currentContext.stack.filter(
      (frame: { scope: string }) => frame.scope !== scope,
    );
    this.updateContext({ ...currentContext, stack: newStack }, 'popStack');
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
    this.updateContext({ ...currentContext, data: newData }, 'setData');
  }

  resetContext() {
    const newContext: RuntimeContext = {
      stack: [],
      data: {},
      plugins: new Map(),
      adapters: new Map(),
      textRegistry: {},
      config: this.runtimeContext$.value.config,
    };
    this.updateContext(newContext, 'resetContext');
  }

  addToTextRegistry(text: string, scope: string) {
    const currentContext = this.runtimeContext$.value;
    const newRegistry = {
      ...currentContext.textRegistry,
      [scope]: [...(currentContext.textRegistry[scope] || []), text],
    };
    this.updateContext(
      { ...currentContext, textRegistry: newRegistry },
      'addToTextRegistry',
    );
  }

  clearTextRegistry(scope: string) {
    const currentContext = this.runtimeContext$.value;
    const newRegistry = { ...currentContext.textRegistry };
    delete newRegistry[scope];
    this.updateContext(
      { ...currentContext, textRegistry: newRegistry },
      'clearTextRegistry',
    );
  }

  registerPlugin(plugin: AIMPlugin, options?: unknown) {
    // Validate plugin
    const pluginResult = validateWithResult('AIMPluginSchema', plugin);
    if (!pluginResult.success) {
      throw new Error(`Invalid plugin: ${pluginResult.error}`);
    }
     
    this.validatePlugin(plugin);
    const currentContext = this.runtimeContext$.value;
    
    // Initialize plugin if needed
    if (plugin.init) {
      try {
        plugin.init(currentContext.config, options);
      } catch (error) {
        throw new Error(`Failed to initialize plugin ${plugin.name}: ${error}`);
      }
    }

    // Register plugin
    const newPlugins = new Map(currentContext.plugins);
    newPlugins.set(plugin.name, plugin);

    // Merge plugin config with current config
    const mergedConfig = this.mergePluginConfig(
      plugin,
      currentContext.config,
    );

    const newContext = {
      ...currentContext,
      plugins: newPlugins,
      config: mergedConfig,
    };

    this.updateContext(newContext, `registerPlugin:${plugin.name}`);
  }

  getPlugin(name: string): AIMPlugin | undefined {
    return this.runtimeContext$.value.plugins.get(name);
  }

  registerAdapter(adapter: AIMAdapter) {
    // Validate adapter
    const adapterResult = validateWithResult('AIMAdapterSchema', adapter);
    if (!adapterResult.success) {
      throw new Error(`Invalid adapter: ${adapterResult.error}`);
    }
     
    const currentContext = this.runtimeContext$.value;
    if (currentContext.adapters.has(adapter.type)) {
      throw new Error(`Adapter with type ${adapter.type} already registered`);
    }

    // Initialize adapter if needed
    if (adapter.init) {
      try {
        adapter.init();
      } catch (error) {
        throw new Error(
          `Failed to initialize adapter ${adapter.type}: ${error}`,
        );
      }
    }

    // Register adapter
    const newAdapters = new Map(currentContext.adapters);
    newAdapters.set(adapter.type, adapter);

    const newContext = {
      ...currentContext,
      adapters: newAdapters,
    };

    this.updateContext(newContext, `registerAdapter:${adapter.type}`);
  }

  getAdapter(type: string): AIMAdapter | undefined {
    return this.runtimeContext$.value.adapters.get(type);
  }

  private validatePlugin(plugin: AIMPlugin) {
    // Use our schema validation
    const validationResult = validateWithResult('AIMPluginSchema', plugin);
    
    if (!validationResult.success) {
      const issues = validationResult.issues.map(issue => 
        `${issue.path}: ${issue.message}`
      ).join(', ');
      
      throw new Error(`Plugin validation failed: ${validationResult.error}. Issues: ${issues}`);
    }
    
    // Additional custom validations can go here...
    const currentContext = this.runtimeContext$.value;
    if (currentContext.plugins.has(plugin.name)) {
      throw new Error(`Plugin ${plugin.name} already registered`);
    }

    if (plugin.dependencies?.plugins) {
      for (const dep of plugin.dependencies.plugins) {
        if (!currentContext.plugins.has(dep.name)) {
          throw new Error(
            `Plugin ${plugin.name} depends on ${dep.name} which is not registered`,
          );
        }
        // TODO: Add version check
      }
    }

    if (plugin.dependencies?.adapters) {
      for (const dep of plugin.dependencies.adapters) {
        if (!currentContext.adapters.has(dep.name)) {
          throw new Error(
            `Plugin ${plugin.name} depends on adapter ${dep.name} which is not registered`,
          );
        }
        // TODO: Add version check
      }
    }
     
    return true;
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
          typeof fn === 'function' ? { execute: fn } : fn,
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
    const stateBlock = {
      timestamp: Date.now(),
      action,
      hash: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      previousHash:
        this.stateChain$.value.length > 0
          ? this.stateChain$.value[this.stateChain$.value.length - 1].hash
          : 'genesis',
      state: newState,
      diff: {
        stack: newState.stack.length - prevState.stack.length,
        textRegistry: Object.keys(newState.textRegistry).length -
          Object.keys(prevState.textRegistry).length,
        data: Object.keys(newState.data).length -
          Object.keys(prevState.data).length,
      },
    };
     
    // Validate the created state block
    const blockResult = validateWithResult('StateBlockSchema', stateBlock);
    if (!blockResult.success) {
      console.warn(`State block validation warning: ${blockResult.error}`);
      // We'll still return the block but log the warning
    }
     
    return stateBlock;
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

    // Merge all scoped variables into a flat object
    // We need to iterate through each scope's variables
    for (const scope in scopedVariables) {
      // For each scope, merge all frame variables
      const scopeVars = scopedVariables[scope];
      for (const frameId in scopeVars) {
        Object.assign(stackVariables, scopeVars[frameId]);
      }
    }

    return stackVariables;
  }

  getCurrentConfig(config: AIMConfig): AIMConfig {
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
    if (!this.runtimeState$.value) {
      throw new Error('Runtime state is not initialized');
    }
    return this.runtimeState$.value;
  }

  getRuntimeContext(): RuntimeContext {
    if (!this.runtimeContext$.value) {
      throw new Error('Runtime context is not initialized');
    }
    return this.runtimeContext$.value;
  }

  getStateHistory(): StateBlock[] {
    if (!this.stateChain$.value) {
      throw new Error('State chain is not initialized');
    }
    return this.stateChain$.value;
  }

  getStateAtBlock(hash: string): RuntimeContext | undefined {
    if (!this.stateChain$.value) {
      throw new Error('State chain is not initialized');
    }
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
