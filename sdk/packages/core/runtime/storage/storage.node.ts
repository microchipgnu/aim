export const getLocalStorageItem = (key: string): string | null => {
  try {
    const fs = require('node:fs');
    const path = require('node:path');
    const storageFile = path.join(process.cwd(), '.aim-storage.json');
    
    if (!fs.existsSync(storageFile)) {
      return null;
    }

    const data = JSON.parse(fs.readFileSync(storageFile, 'utf8')) as Record<string, string>;
    return data[key] || null;
  } catch (error) {
    console.error('Error reading from storage:', error);
    return null;
  }
};

export const setLocalStorageItem = (key: string, value: string): void => {
  try {
    const fs = require('node:fs');
    const path = require('node:path');
    const storageFile = path.join(process.cwd(), '.aim-storage.json');
    
    let data: Record<string, string> = {};
    if (fs.existsSync(storageFile)) {
      data = JSON.parse(fs.readFileSync(storageFile, 'utf8'));
    }

    data[key] = value;
    fs.writeFileSync(storageFile, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error writing to storage:', error);
  }
};
