import type { ConfigFunction } from '@markdoc/markdoc';

export const greaterThan: ConfigFunction = {
  parameters: {
    0: { required: true },
    1: { required: true },
  },
  transform(parameters: Record<string, unknown>) {
    const a = Number.parseInt(parameters[0] as string, 10);
    const b = Number.parseInt(parameters[1] as string, 10);
    return a > b;
  },
};

export const lessThan: ConfigFunction = {
  parameters: {
    0: { required: true },
    1: { required: true },
  },
  transform(parameters: Record<string, unknown>) {
    const a = Number.parseInt(parameters[0] as string, 10);
    const b = Number.parseInt(parameters[1] as string, 10);
    return a < b;
  },
};

export const greaterThanOrEqual: ConfigFunction = {
  parameters: {
    0: { required: true },
    1: { required: true },
  },
  transform(parameters: Record<string, unknown>) {
    const a = Number.parseInt(parameters[0] as string, 10);
    const b = Number.parseInt(parameters[1] as string, 10);
    return a >= b;
  },
};

export const lessThanOrEqual: ConfigFunction = {
  parameters: {
    0: { required: true },
    1: { required: true },
  },
  transform(parameters: Record<string, unknown>) {
    const a = Number.parseInt(parameters[0] as string, 10);
    const b = Number.parseInt(parameters[1] as string, 10);
    return a <= b;
  },
};

export const includes: ConfigFunction = {
  parameters: {
    0: { required: true },
    1: { required: true },
  },
  transform(parameters: Record<string, unknown>) {
    const arr = parameters[0] as Array<unknown>;
    const value = parameters[1];
    return Array.isArray(arr) ? arr.includes(value) : false;
  },
};
