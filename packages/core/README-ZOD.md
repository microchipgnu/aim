# Using Zod Validation in @aim-sdk/core

This package now includes [Zod](https://github.com/colinhacks/zod) schema validation to provide both static type safety and runtime validation. This document explains how to use these features in your code.

## Available Schemas

The following Zod schemas are available for validation:

- `StackFrameSchema` - For stack frames in the runtime
- `StateBlockSchema` - For state blocks in execution history
- `RuntimeContextSchema` - For runtime context validation
- `RuntimeMethodsSchema` - For runtime methods validation
- `RuntimeStateSchema` - For overall runtime state validation
- `AIMOutputSchema` - For output validation
- `AIMAdapterSchema` - For adapter validation
- `AIMPluginSchema` - For plugin validation
- `AIMToolSchema` - For tool validation
- `RuntimeOptionsSchema` - For runtime options validation
- `AIMResultSchema` - For execution result validation
- `AIMConfigSchema` - For AIM configuration validation
- `NodeSchema` - For Markdoc node validation

## Basic Usage

### Importing Schemas

```typescript
import { schemas } from '@aim-sdk/core';

// Use a specific schema
const validatedConfig = schemas.RuntimeOptionsSchema.parse(userConfig);
```

### Validation Utilities

For convenience, the package provides several validation helper functions:

#### Simple Validation (Throws on Error)

```typescript
import { validate } from '@aim-sdk/core';

// This will throw an error if validation fails
// validPlugin will be properly typed as AIMPlugin
const validPlugin = validate('AIMPluginSchema', pluginData);

// TypeScript will infer the correct return type based on schema name
function createAdapter(data: unknown) {
  // adapter will be typed as AIMAdapter
  const adapter = validate('AIMAdapterSchema', data);
  return adapter;
}
```

#### Safe Validation (Returns null on Error)

```typescript
import { validateSafe } from '@aim-sdk/core';

// This will return null if validation fails
// validAdapter will be typed as AIMAdapter | null
const validAdapter = validateSafe('AIMAdapterSchema', adapterData);
if (validAdapter) {
  // validAdapter is definitely AIMAdapter here (not null)
  console.log(validAdapter.type);
}
```

#### Detailed Validation (Returns Result Object)

```typescript
import { validateWithResult } from '@aim-sdk/core';

// This returns a detailed result object
// result.data will be typed as RuntimeOptions | null
const result = validateWithResult('RuntimeOptionsSchema', options);
if (result.success) {
  // result.data is definitely RuntimeOptions here
  console.log(result.data.config);
} else {
  // Handle validation error
  console.error(`Validation failed: ${result.error}`);
  // Detailed validation issues
  result.issues.forEach(issue => {
    console.log(`${issue.path}: ${issue.message}`);
  });
}
```

## Type Inference

You can leverage Zod's type inference to get TypeScript types from the schemas:

```typescript
import { schemas } from '@aim-sdk/core';
import { z } from 'zod';

// Get the inferred type from a schema
type MyRuntimeOptions = z.infer<typeof schemas.RuntimeOptionsSchema>;

// Now you can use this type
const options: MyRuntimeOptions = {
  // ...your options with proper typing
};
```

## Integration with Your Code

### Validating Plugin Configurations

```typescript
import { schemas, validateWithResult } from '@aim-sdk/core';

function registerPlugin(pluginData: unknown) {
  const validation = validateWithResult('AIMPluginSchema', pluginData);
  
  if (!validation.success) {
    throw new Error(`Invalid plugin configuration: ${validation.error}`);
  }
  
  // Use the validated plugin data - properly typed as AIMPlugin
  const plugin = validation.data;
  console.log(`Registering plugin: ${plugin.name} v${plugin.version}`);
  // ...register the plugin
}
```

### Creating Runtime Options with Validation

```typescript
import { schemas } from '@aim-sdk/core';

function createRuntimeOptions(userOptions: unknown) {
  // Merge with defaults and validate
  const options = schemas.RuntimeOptionsSchema.parse({
    ...defaultOptions,
    ...userOptions,
  });
  
  // options is fully typed as RuntimeOptions
  if (options.timeout) {
    console.log(`Setting timeout to ${options.timeout}ms`);
  }
  
  return options;
}
```

### Custom Validators for Complex Types

The library includes custom validators for complex types like Maps and browser-specific objects:

```typescript
import { schemas } from '@aim-sdk/core';

// Validate a context with Map instances
const contextWithMaps = {
  textRegistry: { "scope1": ["Some text"] },
  stack: [{ id: "frame1", scope: "scope1", variables: {} }],
  data: { "scope1": { "key1": "value1" } },
  plugins: new Map([["plugin1", myPlugin]]),
  adapters: new Map([["adapter1", myAdapter]]),
  config: { variables: {} }
};

// This will validate the Map instances properly
const validContext = schemas.RuntimeContextSchema.parse(contextWithMaps);
```

## Benefits of Zod Validation

1. **Type Safety**: Get TypeScript type checking during development
2. **Runtime Validation**: Ensure data structures are valid at runtime 
3. **Error Messages**: Detailed error messages for invalid data
4. **Documentation**: Schemas serve as documentation for expected data structures
5. **Default Values**: Zod can provide default values for missing fields
6. **Type Inference**: TypeScript automatically infers the correct types from schemas 