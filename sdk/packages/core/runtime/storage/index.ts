import * as browserStorage from './storage.browser';
import * as nodeStorage from './storage.node.ts';
import * as jsEnvironment from 'browser-or-node';

export const getLocalStorageItem = (key: string): string | null => {
  if (jsEnvironment.isBrowser) {
    return browserStorage.getLocalStorageItem(key);
  }
  else if (jsEnvironment.isNode) {
    return nodeStorage.getLocalStorageItem(key);
  }
  else {
    throw new Error("Storage is not supported in this environment");
  }
};

export const setLocalStorageItem = (key: string, value: string): void => {
  if (jsEnvironment.isBrowser) {
    browserStorage.setLocalStorageItem(key, value);
  } else if (jsEnvironment.isNode) {
    nodeStorage.setLocalStorageItem(key, value);
  }
  else {
    throw new Error("Storage is not supported in this environment");
  }
};
