import { getLocalStorageItem } from "../storage";
import { baseEnvVars } from "./default";

interface EnvVar {
  key: string;
  value: string;
}

export const getEnvValue = (key: string): string | undefined => {
  // Check process.env first (includes .env file variables)
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }

  // If not found in process.env, check localStorage
  if (typeof window !== 'undefined') {
    const envVarsString = getLocalStorageItem('envVars');
    const envVars: EnvVar[] = envVarsString ? JSON.parse(envVarsString) : [];
    const envVar = envVars.find(env => env.key === key);
    if (envVar) {
      return envVar.value;
    }
  }

  // If not found in localStorage, check for default value
  const defaultEnv = baseEnvVars.find(env => env.key === key);
  return defaultEnv?.default;
};

export const getAllEnvVars = (): Record<string, string> => {
  const envVars: Record<string, string> = {};

  // Add all process.env variables (includes .env file variables)
  if (typeof process !== 'undefined' && process.env) {
    Object.keys(process.env).forEach(key => {
      envVars[key] = process.env[key] as string;
    });
  }

  // Add all localStorage variables
  if (typeof window !== 'undefined') {
    const envVarsString = getLocalStorageItem('envVars');
    const storedEnvVars: EnvVar[] = envVarsString ? JSON.parse(envVarsString) : [];
    storedEnvVars.forEach(env => {
      envVars[env.key] = env.value;
    });
  }

  // Add default values for any missing variables
  baseEnvVars.forEach(env => {
    if (!envVars[env.key] && env.default) {
      envVars[env.key] = env.default;
    }
  });

  return envVars;
};
