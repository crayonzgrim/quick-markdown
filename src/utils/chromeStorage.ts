// Chrome storage mock for development
interface ChromeStorageLocal {
  get: (keys: string[] | string) => Promise<{ [key: string]: unknown }>;
  set: (data: { [key: string]: unknown }) => Promise<void>;
  remove: (keys: string[] | string) => Promise<void>;
  clear: () => Promise<void>;
}

// localStorage를 사용한 chrome.storage.local 모킹
const mockChromeStorage: ChromeStorageLocal = {
  get: async (keys) => {
    const keyArray = Array.isArray(keys) ? keys : [keys];
    const result: { [key: string]: unknown } = {};
    
    keyArray.forEach(key => {
      const stored = localStorage.getItem(`chrome_storage_${key}`);
      if (stored !== null) {
        try {
          result[key] = JSON.parse(stored);
        } catch {
          result[key] = stored;
        }
      }
    });
    
    return result;
  },

  set: async (data) => {
    Object.keys(data).forEach(key => {
      const value = typeof data[key] === 'string' 
        ? data[key] 
        : JSON.stringify(data[key]);
      localStorage.setItem(`chrome_storage_${key}`, value);
    });
  },

  remove: async (keys) => {
    const keyArray = Array.isArray(keys) ? keys : [keys];
    keyArray.forEach(key => {
      localStorage.removeItem(`chrome_storage_${key}`);
    });
  },

  clear: async () => {
    const keys = Object.keys(localStorage).filter(key => 
      key.startsWith('chrome_storage_')
    );
    keys.forEach(key => localStorage.removeItem(key));
  }
};

// Chrome extension 환경인지 확인하는 함수
export const isExtensionEnvironment = (): boolean => {
  return typeof chrome !== 'undefined' && 
         chrome.storage && 
         chrome.storage.local !== undefined;
};

// Chrome storage API 제공 (실제 환경 또는 모킹)
export const chromeStorage: ChromeStorageLocal = isExtensionEnvironment() 
  ? chrome.storage.local 
  : mockChromeStorage;

// 디버그용: 현재 저장된 모든 데이터 출력
export const debugStorage = async () => {
  if (isExtensionEnvironment()) {
    chrome.storage.local.get(null, (result) => {
      console.log('Chrome storage contents:', result);
    });
  } else {
    const mockData: { [key: string]: unknown } = {};
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('chrome_storage_')) {
        const actualKey = key.replace('chrome_storage_', '');
        try {
          mockData[actualKey] = JSON.parse(localStorage.getItem(key) || '');
        } catch {
          mockData[actualKey] = localStorage.getItem(key);
        }
      }
    });
    console.log('Mock storage contents:', mockData);
  }
};