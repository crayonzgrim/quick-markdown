// 설정값용 (동기화됨)
export const setConfig = async (
  key: string,
  value: string | number | boolean
): Promise<void> => {
  await chrome.storage.sync.set({ [key]: value });
};

export const getConfig = async <T>(
  key: string,
  defaultValue: T
): Promise<T> => {
  const result = await chrome.storage.sync.get([key]);
  return result[key] !== undefined ? result[key] : defaultValue;
};

// 에디터 내용용 (로컬 저장, 용량 큼)
export const setContent = async (key: string, value: string): Promise<void> => {
  await chrome.storage.local.set({ [key]: value });
};

export const getContent = async <T>(
  key: string,
  defaultValue: T
): Promise<T> => {
  const result = await chrome.storage.local.get([key]);
  return result[key] !== undefined ? result[key] : defaultValue;
};

// localStorage에서 chrome.storage로 마이그레이션
export const migrateFromLocalStorage = async (): Promise<void> => {
  const keysToMigrate = [
    { old: 'markdown-editor-content', new: 'editor-content', type: 'content' }
  ];

  for (const { old, new: newKey, type } of keysToMigrate) {
    const value = localStorage.getItem(old);
    if (value !== null) {
      if (type === 'config') {
        await setConfig(newKey, value);
      } else {
        await setContent(newKey, value);
      }
      localStorage.removeItem(old);
    }
  }
};

