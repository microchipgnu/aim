import { z } from 'zod';
import type { RenderableTreeNodes } from '@markdoc/markdoc';

// Custom validators for complex types
const MapSchema = <K extends string, V>(keyType: z.ZodType<K>, valueType: z.ZodType<V>) => 
  z.custom<Map<K, V>>((data) => data instanceof Map, {
    message: "Expected a Map instance"
  });

const AbortSignalSchema = z.custom<AbortSignal>(
  (data) => data instanceof AbortSignal || 
            (typeof data === 'object' && data !== null && 'aborted' in data),
  { message: "Expected an AbortSignal instance" }
);

// Basic schemas
export const StackFrameSchema = z.object({
  id: z.string(),
  scope: z.string(),
  variables: z.record(z.string(), z.unknown()),
});

// Schema for Node type - define with explicit typing
export const NodeSchema: z.ZodType<{
  type: string;
  attributes?: Record<string, unknown>;
  children?: Array<any>; // Accept any for children to avoid circular reference issues
  [k: string]: unknown; // Allow additional properties
}> = z.lazy(() => z.object({
  type: z.string(),
  attributes: z.record(z.string(), z.unknown()).optional(),
  children: z.array(z.lazy(() => NodeSchema)).optional(),
}).passthrough());

// Declare a schema for AIMConfig based on ConfigType from @markdoc/markdoc
export const AIMConfigSchema = z.object({
  variables: z.record(z.string(), z.unknown()).optional(),
  nodes: z.record(z.string(), z.unknown()).optional(),
  tags: z.record(z.string(), z.unknown()).optional(),
  functions: z.record(z.string(), z.unknown()).optional(),
  partials: z.record(z.string(), z.unknown()).optional(),
  validation: z.object({
    parents: z.array(NodeSchema).optional(),
    validateFunctions: z.boolean().optional(),
    environment: z.string().optional(),
  }).optional(),
}).passthrough(); // Allow additional properties for extensibility

// Schema for AsyncGenerator
const AsyncGeneratorSchema = z.custom<AsyncGenerator<unknown>>(
  (data) => typeof data === 'object' && data !== null && Symbol.asyncIterator in data,
  { message: "Expected an AsyncGenerator" }
);

// Schema for ZodObject
const ZodObjectSchema = z.custom<z.ZodObject<any>>(
  (data) => data instanceof z.ZodObject,
  { message: "Expected a Zod object schema" }
);

// Schema for external tools (simplified)
const ExternalToolSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
}).passthrough();

// Define AIMOutput before using it
export const AIMOutputSchema = z.object({
  success: z.boolean(),
  data: z.unknown().optional(),
  type: z.enum(['text', 'code', 'image', 'structured', 'error']),
  content: z.union([z.string(), z.record(z.string(), z.unknown())]),
});

// Runtime schemas with circular references broken
export const AIMToolSchema = z.object({
  description: z.string(),
  parameters: ZodObjectSchema,
  execute: z.function()
    .args(z.unknown())
    .returns(z.promise(z.unknown())),
});

// Define AIMAdapter first
export const AIMAdapterSchema = z.object({
  type: z.string(),
  init: z.function().args().returns(z.void()).optional(),
  handlers: z.record(
    z.string(),
    z.function().args(z.array(z.unknown())).returns(z.promise(z.unknown()))
  ),
});

// Define RuntimeContext with forward declaration to break circular references
export const RuntimeContextSchema: z.ZodType<any> = z.lazy(() => z.object({
  textRegistry: z.record(z.string(), z.array(z.string())),
  stack: z.array(StackFrameSchema),
  data: z.record(z.string(), z.record(z.string(), z.unknown())),
  plugins: z.any(), // Using z.any() for Map<string, AIMPlugin>
  adapters: z.any(), // Using z.any() for Map<string, AIMAdapter>
  config: AIMConfigSchema,
}));

// Function type for the promise parameters
const ConfigPromiseSchema = z.promise(AIMConfigSchema);
const RuntimeContextPromiseSchema = z.promise(RuntimeContextSchema);

export const RuntimeMethodsSchema = z.object({
  pushStack: z.function()
    .args(z.object({
      id: z.string(),
      scope: z.string(),
      variables: z.record(z.string(), z.unknown()),
    }))
    .returns(z.void()),
  popStack: z.function()
    .args(z.object({
      scope: z.string(),
    }))
    .returns(z.void()),
  setData: z.function()
    .args(z.object({
      data: z.record(z.string(), z.unknown()),
      scope: z.string(),
    }))
    .returns(z.void()),
  resetContext: z.function()
    .args()
    .returns(z.void()),
  addToTextRegistry: z.function()
    .args(z.object({
      text: z.string(),
      scope: z.string(),
    }))
    .returns(z.void()),
  clearTextRegistry: z.function()
    .args(z.object({
      scope: z.string(),
    }))
    .returns(z.void()),
  getCurrentConfig: z.function()
    .args(AIMConfigSchema)
    .returns(ConfigPromiseSchema),
  getRuntimeContext: z.function()
    .args()
    .returns(RuntimeContextPromiseSchema),
});

// Define AIMPlugin with lazy references
export const AIMPluginSchema: z.ZodType<any> = z.lazy(() => z.object({
  name: z.string(),
  version: z.string(),
  description: z.string().optional(),
  author: z.string().optional(),
  license: z.string().optional(),
  dependencies: z.object({
    plugins: z.array(
      z.object({
        name: z.string(),
        versionRange: z.string(),
      })
    ).optional(),
    adapters: z.array(
      z.object({
        name: z.string(),
        versionRange: z.string(),
      })
    ).optional(),
  }).optional(),
  configSchema: z.unknown().optional(),
  init: z.function()
    .args(AIMConfigSchema, z.unknown().optional())
    .returns(z.void())
    .optional(),
  tags: z.record(
    z.string(),
    z.object({
      render: z.string().optional(),
      selfClosing: z.boolean().optional(),
      attributes: z.record(z.string(), z.unknown()).optional(),
      transform: z.function().optional(),
      children: z.array(z.string()).optional(),
      validate: z.function().optional(),
      execute: z.function()
        .args(z.object({
          node: NodeSchema,
          config: AIMConfigSchema,
          state: z.lazy(() => RuntimeStateSchema),
        }))
        .returns(AsyncGeneratorSchema),
    })
  ).optional(),
  functions: z.record(z.string(), z.function()).optional(),
  hooks: z.object({
    beforeExecution: z.function()
      .args(z.lazy(() => RuntimeContextSchema))
      .returns(z.promise(z.void()))
      .optional(),
    afterExecution: z.function()
      .args(z.lazy(() => RuntimeContextSchema), z.unknown())
      .returns(z.promise(z.void()))
      .optional(),
    onError: z.function()
      .args(z.lazy(() => RuntimeContextSchema), z.instanceof(Error))
      .returns(z.promise(z.void()))
      .optional(),
  }).optional(),
}));

export const RuntimeStateSchema: z.ZodType<any> = z.lazy(() => z.object({
  options: z.lazy(() => RuntimeOptionsSchema),
  context: z.object({
    textRegistry: z.record(z.string(), z.array(z.string())),
    stack: z.array(StackFrameSchema),
    data: z.record(z.string(), z.record(z.string(), z.unknown())),
    plugins: z.any(), // Using z.any() for Map<string, AIMPlugin>
    adapters: z.any(), // Using z.any() for Map<string, AIMAdapter>
    config: AIMConfigSchema,
    methods: RuntimeMethodsSchema,
  }),
}));

// Define StateBlock schema with a better circular reference handling
export const StateBlockSchema = z.object({
  timestamp: z.number(),
  action: z.string(),
  hash: z.string(),
  previousHash: z.string(),
  state: RuntimeContextSchema, // Now that RuntimeContextSchema is defined, we can use it directly
  diff: z.object({
    stack: z.number(),
    textRegistry: z.number(),
    data: z.number(),
  }),
});

// Define RuntimeOptions with lazy references
export const RuntimeOptionsSchema: z.ZodType<any> = z.lazy(() => z.object({
  config: AIMConfigSchema,
  input: z.record(z.string(), z.union([
    z.string(), 
    z.record(z.string(), z.unknown()), 
    z.number()
  ])).optional(),
  events: z.object({
    onLog: z.function().args(z.string()).returns(z.void()).optional(),
    onError: z.function().args(z.string()).returns(z.void()).optional(),
    onSuccess: z.function().args(z.string()).returns(z.void()).optional(),
    onAbort: z.function().args(z.string()).returns(z.void()).optional(),
    onFinish: z.function().args(z.string()).returns(z.void()).optional(),
    onStart: z.function().args(z.string()).returns(z.void()).optional(),
    onStep: z.function().args(z.string()).returns(z.void()).optional(),
    onData: z.function().args(z.unknown()).returns(z.void()).optional(),
    onToolCall: z.function().args(z.string(), z.unknown()).returns(z.void()).optional(),
    onOutput: z.function()
      .args(AIMOutputSchema)
      .returns(z.promise(z.void()))
      .optional(),
    onUserInput: z.function()
      .args(z.string())
      .returns(z.promise(z.string()))
      .optional(),
  }).optional(),
  signals: z.object({
    abort: AbortSignalSchema,
  }),
  settings: z.object({
    useScoping: z.boolean(),
  }),
  env: z.record(z.string(), z.string()).optional(),
  timeout: z.number().optional(),
  maxRetries: z.number().optional(),
  variables: z.record(z.string(), z.unknown()).optional(),
  environment: z.enum(['node', 'browser']).optional(),
  getReferencedFlow: z.function()
    .args(z.string())
    .returns(z.promise(z.object({ name: z.string() }).nullable()))
    .optional(),
  plugins: z.array(
    z.object({
      plugin: AIMPluginSchema,
      options: z.unknown().optional(),
    })
  ).optional(),
  adapters: z.array(AIMAdapterSchema).optional(),
  tools: z.record(
    z.string(),
    z.union([
      ExternalToolSchema,
      AIMToolSchema
    ])
  ).optional(),
  experimental_files: z.record(
    z.string(),
    z.object({
      content: z.string(),
    })
  ).optional(),
}));

// Define StateManager schema
export const StateManagerSchema = z.object({
  getState: z.function()
    .args()
    .returns(RuntimeStateSchema),
  setState: z.function()
    .args(z.function()
      .args(RuntimeStateSchema)
      .returns(RuntimeStateSchema))
    .returns(z.void()),
  methods: RuntimeMethodsSchema,
});

// Define AIMRuntime schema
export const AIMRuntimeSchema = z.object({
  node: NodeSchema,
  stateManager: StateManagerSchema,
});

export const AIMResultSchema = z.object({
  ast: NodeSchema,
  errors: z.array(z.unknown()),
  warnings: z.array(z.unknown()),
  execute: z.function()
    .args(z.object({}).passthrough())
    .returns(z.promise(z.unknown())),
});

// Type inference helpers
export type StackFrame = z.infer<typeof StackFrameSchema>;
export type StateBlock = z.infer<typeof StateBlockSchema>;
export type RuntimeContext = z.infer<typeof RuntimeContextSchema>;
export type RuntimeMethods = z.infer<typeof RuntimeMethodsSchema>;
export type RuntimeState = z.infer<typeof RuntimeStateSchema>;
export type AIMOutput = z.infer<typeof AIMOutputSchema>;
export type AIMAdapter = z.infer<typeof AIMAdapterSchema>;
export type AIMPlugin = z.infer<typeof AIMPluginSchema>;
export type AIMTool = z.infer<typeof AIMToolSchema>;
export type RuntimeOptions = z.infer<typeof RuntimeOptionsSchema>;
export type StateManager = z.infer<typeof StateManagerSchema>;
export type AIMRuntime = z.infer<typeof AIMRuntimeSchema>;
export type AIMResult = z.infer<typeof AIMResultSchema>;
export type AIMConfig = z.infer<typeof AIMConfigSchema>;
export type Node = z.infer<typeof NodeSchema>;

// Re-export types from @markdoc/markdoc
export type { RenderableTreeNodes }; 