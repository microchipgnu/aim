import * as browserStorage from './storage.browser';
import * as nodeStorage from './storage.node.ts';

export const getLocalStorageItem = (key: string): string | null => {
  // Check if we're in a browser environment
  if (typeof window !== 'undefined') {
    return browserStorage.getLocalStorageItem(key);
  }
  // Otherwise use Node.js storage
  return nodeStorage.getLocalStorageItem(key);
};

export const setLocalStorageItem = (key: string, value: string): void => {
  // Check if we're in a browser environment
  if (typeof window !== 'undefined') {
    browserStorage.setLocalStorageItem(key, value);
  } else {
    // Otherwise use Node.js storage
    nodeStorage.setLocalStorageItem(key, value);
  }
};

