import * as schemas from './schemas';
import type { z } from 'zod';

/**
 * Extract schema names from the schemas object
 */
type SchemaName = keyof typeof schemas;

/**
 * Extract inferred type from a schema
 */
type SchemaType<T extends SchemaName> = 
  typeof schemas[T] extends z.ZodType<infer R> ? R : never;

/**
 * Validates input against a schema and returns validated data.
 * Throws a validation error if validation fails.
 * 
 * @param schemaName The name of the schema in the schemas object
 * @param input The input data to validate
 * @returns The validated data with proper typing
 */
export function validate<T extends SchemaName>(
  schemaName: T,
  input: unknown
): SchemaType<T> {
  const schema = schemas[schemaName];
  if (!schema || typeof schema.parse !== 'function') {
    throw new Error(`Schema '${String(schemaName)}' not found or not a valid Zod schema`);
  }
  return schema.parse(input) as SchemaType<T>;
}

/**
 * Safely validates input against a schema without throwing.
 * Returns null if validation fails.
 * 
 * @param schemaName The name of the schema in the schemas object
 * @param input The input data to validate
 * @returns The validated data or null if validation fails
 */
export function validateSafe<T extends SchemaName>(
  schemaName: T,
  input: unknown
): SchemaType<T> | null {
  try {
    return validate(schemaName, input);
  } catch (error) {
    return null;
  }
}

/**
 * Safely validates input against a schema without throwing.
 * Returns a result object with success status, data, and error information.
 * 
 * @param schemaName The name of the schema in the schemas object
 * @param input The input data to validate
 * @returns An object with validation result information
 */
export function validateWithResult<T extends SchemaName>(
  schemaName: T,
  input: unknown
): { 
  success: boolean; 
  data: SchemaType<T> | null;
  error: string | null; 
  issues: Array<{ path: string; message: string }>;
} {
  const schema = schemas[schemaName];
  if (!schema || typeof schema.safeParse !== 'function') {
    return {
      success: false,
      data: null,
      error: `Schema '${String(schemaName)}' not found or not a valid Zod schema`,
      issues: [],
    };
  }

  const result = schema.safeParse(input) as z.SafeParseReturnType<unknown, SchemaType<T>>;
  if (result.success) {
    return {
      success: true,
      data: result.data,
      error: null,
      issues: [],
    };
  } else {
    const issues = Array.isArray(result.error?.errors) 
      ? result.error.errors.map((issue: any) => ({
          path: issue.path?.join('.') || '',
          message: issue.message || 'Invalid value',
        }))
      : [];
    
    return {
      success: false,
      data: null,
      error: result.error?.message || 'Validation failed',
      issues,
    };
  }
} 