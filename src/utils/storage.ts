import type { Note } from '../types';

// Chrome extension 환경인지 확인하는 함수
const isExtensionEnvironment = (): boolean => {
  return (
    typeof chrome !== 'undefined' &&
    chrome.storage &&
    chrome.storage.local !== undefined
  );
};

// localStorage 기반 storage 구현
const localStorageSync = {
  get: (keys: string[]) => {
    const result: { [key: string]: unknown } = {};
    keys.forEach((key) => {
      const stored = localStorage.getItem(`chrome_storage_${key}`);
      if (stored !== null) {
        try {
          result[key] = JSON.parse(stored);
        } catch {
          result[key] = stored;
        }
      }
    });
    return Promise.resolve(result);
  },

  set: (data: { [key: string]: unknown }) => {
    return new Promise<void>((resolve) => {
      try {
        Object.keys(data).forEach((key) => {
          const value =
            typeof data[key] === 'string'
              ? data[key]
              : JSON.stringify(data[key]);
          localStorage.setItem(`chrome_storage_${key}`, value);
        });
        resolve();
      } catch (error) {
        console.error('localStorage set error:', error);
        resolve(); // 에러가 있어도 resolve
      }
    });
  }
};

// 환경에 따른 storage 선택 (local storage를 사용하여 용량 제한 해결)
const getStorage = () => {
  return isExtensionEnvironment() ? chrome.storage.local : localStorageSync;
};

export const setConfig = async (
  key: string,
  value: string | number | boolean
): Promise<void> => {
  const storage = getStorage();
  await storage.set({ [key]: value });
};

export const getConfig = async <T>(
  key: string,
  defaultValue: T
): Promise<T> => {
  const storage = getStorage();
  const result = await storage.get([key]);
  return result[key] !== undefined ? result[key] : defaultValue;
};

export const setContent = async (
  key: string,
  value: string
): Promise<boolean> => {
  return new Promise((resolve) => {
    const storage = getStorage();

    if (isExtensionEnvironment()) {
      chrome.storage.local.set({ [key]: value }, () => {
        if (chrome.runtime.lastError) {
          console.error('setContent Error:', chrome.runtime.lastError.message);
          resolve(false);
        } else {
          resolve(true);
        }
      });
    } else {
      storage
        .set({ [key]: value })
        .then(() => resolve(true))
        .catch(() => resolve(false));
    }
  });
};

export const getContent = async <T>(
  key: string,
  defaultValue: T
): Promise<T> => {
  const storage = getStorage();
  const result = await storage.get([key]);
  return result[key] !== undefined ? result[key] : defaultValue;
};

export const getNotes = async (): Promise<Note[]> => {
  const storage = getStorage();
  const result = await storage.get(['notes']);
  return result.notes || [];
};

export const saveNotes = async (notes: Note[]): Promise<boolean> => {
  return new Promise((resolve) => {
    const storage = getStorage();

    if (isExtensionEnvironment()) {
      chrome.storage.local.set({ notes }, () => {
        if (chrome.runtime.lastError) {
          console.error('saveNotes Error:', chrome.runtime.lastError.message);
          resolve(false);
        } else {
          resolve(true);
        }
      });
    } else {
      storage
        .set({ notes })
        .then(() => resolve(true))
        .catch(() => resolve(false));
    }
  });
};

export const createNote = async (title?: string): Promise<Note | null> => {
  const notes = await getNotes();
  const now = Date.now();

  const newNote: Note = {
    id: `note_${now}`,
    title: title || new Date(now).toLocaleString('ko-KR'),
    content: '',
    createdAt: now,
    updatedAt: now
  };

  const updatedNotes = [newNote, ...notes]; // 최신이 맨 앞에
  const success = await saveNotes(updatedNotes);

  return success ? newNote : null;
};

export const updateNote = async (
  noteId: string,
  content: string
): Promise<boolean> => {
  const notes = await getNotes();
  const noteIndex = notes.findIndex((note) => note.id === noteId);

  if (noteIndex === -1) return false;

  notes[noteIndex].content = content;
  notes[noteIndex].updatedAt = Date.now();

  return await saveNotes(notes);
};

export const updateNoteTitle = async (
  noteId: string,
  title: string
): Promise<boolean> => {
  const notes = await getNotes();
  const noteIndex = notes.findIndex((note) => note.id === noteId);

  if (noteIndex === -1) return false;

  notes[noteIndex].title = title;
  notes[noteIndex].updatedAt = Date.now();

  return await saveNotes(notes);
};

export const deleteNote = async (noteId: string): Promise<boolean> => {
  const notes = await getNotes();
  const filteredNotes = notes.filter((note) => note.id !== noteId);

  return await saveNotes(filteredNotes);
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
