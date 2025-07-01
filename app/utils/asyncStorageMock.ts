/**
 * 这是一个简单的AsyncStorage模拟实现，用于解决MetaMask SDK的依赖问题
 * 在浏览器环境中，我们使用localStorage作为后备存储
 */

// 内存存储对象
const memoryStorage: Record<string, string> = {};

// 异步存储模拟
const AsyncStorageMock = {
  getItem: async (key: string): Promise<string | null> => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(key);
    }
    return memoryStorage[key] || null;
  },
  
  setItem: async (key: string, value: string): Promise<void> => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(key, value);
    } else {
      memoryStorage[key] = value;
    }
  },
  
  removeItem: async (key: string): Promise<void> => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(key);
    } else {
      delete memoryStorage[key];
    }
  },
  
  clear: async (): Promise<void> => {
    if (typeof window !== 'undefined') {
      localStorage.clear();
    } else {
      Object.keys(memoryStorage).forEach(key => {
        delete memoryStorage[key];
      });
    }
  },
  
  getAllKeys: async (): Promise<string[]> => {
    if (typeof window !== 'undefined') {
      return Array.from({ length: localStorage.length }, (_, i) => localStorage.key(i) || '').filter(Boolean);
    }
    return Object.keys(memoryStorage);
  },
  
  multiGet: async (keys: string[]): Promise<[string, string | null][]> => {
    return Promise.all(
      keys.map(async key => [key, await AsyncStorageMock.getItem(key)])
    );
  },
  
  multiSet: async (keyValuePairs: [string, string][]): Promise<void> => {
    for (const [key, value] of keyValuePairs) {
      await AsyncStorageMock.setItem(key, value);
    }
  },
  
  multiRemove: async (keys: string[]): Promise<void> => {
    for (const key of keys) {
      await AsyncStorageMock.removeItem(key);
    }
  }
};

export default AsyncStorageMock; 