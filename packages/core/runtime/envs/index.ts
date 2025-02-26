import { baseEnvVars } from './default';

export const getEnvValue = (key: string): string | undefined => {
  // Check process.env first (includes .env file variables)
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }

  // If not found in localStorage, check for default value
  const defaultEnv = baseEnvVars.find((env) => env.key === key);
  return defaultEnv?.default;
};

export const getAllEnvVars = (): Record<string, string> => {
  const envVars: Record<string, string> = {};

  // Add all process.env variables (includes .env file variables)
  if (typeof process !== 'undefined' && process.env) {
    Object.keys(process.env).forEach((key) => {
      envVars[key] = process.env[key] as string;
    });
  }

  // Add default values for any missing variables
  baseEnvVars.forEach((env) => {
    if (!envVars[env.key] && env.default) {
      envVars[env.key] = env.default;
    }
  });

  return envVars;
};
