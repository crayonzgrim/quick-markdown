import { useCallback, useEffect, useState } from 'react';
import {
  createNote as createNoteAPI,
  deleteNote as deleteNoteAPI,
  getNotes as getNotesAPI,
  updateNote as updateNoteAPI,
  updateNoteTitle as updateNoteTitleAPI,
  migrateFromLocalStorage,
  getContent,
  setContent
} from '../utils/storage';
import type { Note } from '../types';

export const useNotes = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [currentNote, setCurrentNote] = useState<Note | null>(null);
  const [storageError, setStorageError] = useState(false);

  const refreshNotes = useCallback(async () => {
    const updatedNotes = await getNotesAPI();
    setNotes(updatedNotes);
  }, []);

  useEffect(() => {
    const initializeNotes = async () => {
      // 마이그레이션 먼저 실행
      await migrateFromLocalStorage();

      // 노트 목록 로드
      const savedNotes = await getNotesAPI();
      setNotes(savedNotes);

      // 기존 에디터 내용이 있다면 새 노트로 마이그레이션
      const savedText = await getContent('editor-content', '');
      if (savedText && savedNotes.length === 0) {
        const note = await createNoteAPI('이전 메모');
        if (note) {
          await updateNoteAPI(note.id, savedText);
          await refreshNotes();
        }
        await setContent('editor-content', '');
      }
    };

    initializeNotes();
  }, [refreshNotes]);

  const createNote = async (title?: string): Promise<Note | null> => {
    try {
      const note = await createNoteAPI(title);
      if (note) {
        await refreshNotes();
        return note;
      } else {
        console.error('Failed to create note');
        alert('노트 생성에 실패했습니다. 저장 공간을 확인해주세요.');
        return null;
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Create note error:', error.message);
      }
      alert('노트 생성 중 오류가 발생했습니다.');
      return null;
    }
  };

  const updateNote = async (noteId: string, content: string): Promise<boolean> => {
    const success = await updateNoteAPI(noteId, content);
    setStorageError(!success);

    if (!success) {
      console.warn('노트 저장에 실패했습니다. 용량 제한을 확인해주세요.');
    } else {
      await refreshNotes();
    }

    return success;
  };

  const updateNoteTitle = async (noteId: string, title: string): Promise<boolean> => {
    const success = await updateNoteTitleAPI(noteId, title);
    if (success) {
      await refreshNotes();
      if (currentNote?.id === noteId) {
        setCurrentNote({ ...currentNote, title });
      }
    } else {
      alert('제목 저장에 실패했습니다.');
    }
    return success;
  };

  const deleteNote = async (noteId: string): Promise<boolean> => {
    const success = await deleteNoteAPI(noteId);
    if (success) {
      await refreshNotes();
      if (currentNote?.id === noteId) {
        setCurrentNote(null);
      }
    }
    return success;
  };

  const selectNote = (note: Note) => {
    setCurrentNote(note);
  };

  const clearCurrentNote = () => {
    setCurrentNote(null);
  };

  const dismissStorageError = () => {
    setStorageError(false);
  };

  return {
    notes,
    currentNote,
    storageError,
    createNote,
    updateNote,
    updateNoteTitle,
    deleteNote,
    selectNote,
    clearCurrentNote,
    dismissStorageError
  };
};