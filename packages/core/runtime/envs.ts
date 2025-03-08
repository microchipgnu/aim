/**
 * Gets all environment variables from the process.env object
 * @returns Record of environment variables
 */
export function getAllEnvVars(): Record<string, unknown> {
  return { ...process.env };
}
