import { Platform } from 'react-native';

const getDocumentDir = (): string => {
  if (Platform.OS === 'ios') {
    return '/var/mobile/Containers/Data/Application/Documents';
  }
  return '/data/user/0/com.message.pro.com/files';
};

const getCacheDir = (): string => {
  if (Platform.OS === 'ios') {
    return '/var/mobile/Containers/Data/Application/Library/Caches';
  }
  return '/data/user/0/com.message.pro.com/cache';
};

// In-memory path → size tracking for stat
const fileMetadata: Record<string, { size: number; lastModified: number }> = {};

export default {
  config: (options?: any) => {
    const configPath = options?.path || '';
    return {
      fetch: async (method: string, url: string, headers?: any) => {
        try {
          const response = await fetch(url, {
            method: method || 'GET',
            headers: headers || {},
          });
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }
          const blob = await response.blob();
          return {
            json: async () => {
              try {
                return await response.json();
              } catch {
                return {};
              }
            },
            text: async () => {
              try {
                return await response.text();
              } catch {
                return '';
              }
            },
            status: response.status,
            respType: 'blob',
            blob: () => Promise.resolve(blob),
          };
        } catch (e: any) {
          throw e;
        }
      },
    };
  },
  polyfill: () => {},
  fs: {
    dirs: {
      DocumentDir: getDocumentDir(),
      CacheDir: getCacheDir(),
      MainBundleDir: '',
      CachesDir: getCacheDir(),
      LibraryDir: '',
    },
    exists: async (path: string): Promise<boolean> => {
      return path in fileMetadata;
    },
    writeFile: async (path: string, data: string, encoding?: string): Promise<number> => {
      fileMetadata[path] = { size: data.length, lastModified: Date.now() };
      return data.length;
    },
    readFile: async (path: string, encoding?: string): Promise<string> => {
      return '';
    },
    mkdir: async (path: string): Promise<void> => {},
    stat: async (path: string): Promise<{ size: number; lastModified: number }> => {
      if (fileMetadata[path]) {
        return fileMetadata[path];
      }
      return { size: 0, lastModified: Date.now() };
    },
    cp: async (source: string, target: string): Promise<void> => {
      if (fileMetadata[source]) {
        fileMetadata[target] = { ...fileMetadata[source] };
      }
    },
    mv: async (source: string, target: string): Promise<void> => {
      if (fileMetadata[source]) {
        fileMetadata[target] = { ...fileMetadata[source] };
        delete fileMetadata[source];
      }
    },
    unlink: async (path: string): Promise<void> => {
      delete fileMetadata[path];
    },
  },
  Android: {
    appendFile: async (path: string, data: string, encoding?: string): Promise<number> => {
      const existing = fileMetadata[path]?.size || 0;
      fileMetadata[path] = { size: existing + data.length, lastModified: Date.now() };
      return existing + data.length;
    },
  },
};
