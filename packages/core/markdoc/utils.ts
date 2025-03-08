export function resolveValue(value: any, context: any): any {
  // Handle null/undefined
  if (value == null) {
    return value;
  }

  // Handle primitive types
  if (typeof value !== 'object') {
    return value;
  }

  // Handle Markdoc Function type
  if ('$$mdtype' in value && value.$$mdtype === 'Function') {
    // Resolve any variables in the function parameters first
    const resolvedParams = Object.fromEntries(
      Object.entries(value.parameters).map(([k, v]) => [
        k,
        resolveValue(v, context),
      ]),
    );
    // Create new function object with resolved parameters
    const resolvedFunction = Object.create(value);
    resolvedFunction.parameters = resolvedParams;
    return resolvedFunction.resolve(context);
  }

  // Handle Markdoc Variable type
  if ('$$mdtype' in value && value.$$mdtype === 'Variable') {
    const path = value.path;
    let resolvedValue = context.variables;
    for (const segment of path) {
      if (resolvedValue && typeof resolvedValue === 'object') {
        resolvedValue = resolvedValue[segment];
      } else {
        resolvedValue = undefined;
        break;
      }
    }
    return resolvedValue;
  }

  // Handle arrays recursively
  if (Array.isArray(value)) {
    return value.map((item) => resolveValue(item, context));
  }

  // Handle objects recursively
  if (typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, resolveValue(v, context)]),
    );
  }

  return value;
}
