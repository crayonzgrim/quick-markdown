// const isExtensionContext = typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync;

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

// 에디터 내용용 (동기화됨, 용량 제한에 주의)
export const setContent = async (
  key: string,
  value: string
): Promise<boolean> => {
  return new Promise((resolve) => {
    chrome.storage.sync.set({ [key]: value }, () => {
      if (chrome.runtime.lastError) {
        console.error('setContent Error:', chrome.runtime.lastError.message);
        resolve(false); // 저장 실패 (용량 초과 등)
      } else {
        resolve(true); // 저장 성공
      }
    });
  });
};

export const getContent = async <T>(
  key: string,
  defaultValue: T
): Promise<T> => {
  const result = await chrome.storage.sync.get([key]);
  return result[key] !== undefined ? result[key] : defaultValue;
};

// 노트 데이터 타입 정의
export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}

// 노트 관련 함수들
export const getNotes = async (): Promise<Note[]> => {
  const result = await chrome.storage.sync.get(['notes']);
  return result.notes || [];
};

export const saveNotes = async (notes: Note[]): Promise<boolean> => {
  return new Promise((resolve) => {
    chrome.storage.sync.set({ notes }, () => {
      if (chrome.runtime.lastError) {
        console.error('saveNotes Error:', chrome.runtime.lastError.message);
        resolve(false);
      } else {
        resolve(true);
      }
    });
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
