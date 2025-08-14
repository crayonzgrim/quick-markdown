import { useEffect, useState } from 'react';
import 'allotment/dist/style.css';
import './index.css';
import { Toolbar, NotesList, NoteEditor, Modal } from './components';
import { useTheme, useFontSize, useNotes } from './hooks';
import { chromeStorage, debugStorage } from './utils/chromeStorage';
import type { Note, MdScreen } from './types';

function App() {
  const { theme, toggleTheme } = useTheme();
  const { fontSize, updateFontSize, MIN_FONT_SIZE, MAX_FONT_SIZE } = useFontSize();
  const { 
    notes, 
    currentNote, 
    storageError, 
    createNote: createNoteHook, 
    updateNote, 
    updateNoteTitle, 
    deleteNote, 
    selectNote, 
    clearCurrentNote,
    dismissStorageError 
  } = useNotes();

  const [text, setText] = useState<string | undefined>('');
  const [mdScreen, setMdScreen] = useState<MdScreen>('edit');
  const [showNoteList, setShowNoteList] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editingTitle, setEditingTitle] = useState('');
  const [isCopiedEmail, setIsCopiedEmail] = useState(false);

  const handleCopyEmail = () => {
    setIsCopiedEmail(true);
    navigator.clipboard.writeText('crayonzgrim@gmail.com');
    setTimeout(() => {
      setIsCopiedEmail(false);
    }, 1200);
  };

  const downloadMarkdown = () => {
    if (!text || !currentNote) return;

    const title = currentNote.title || new Date().toLocaleString('ko-KR');
    const filename = `${title}.md`;

    const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.style.display = 'none';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => URL.revokeObjectURL(link.href), 100);
  };

  const handleCreateNote = async () => {
    const note = await createNoteHook(newNoteTitle || undefined);
    if (note) {
      selectNote(note);
      setText(note.content);
      setShowNoteList(false);
    }
    setShowCreateModal(false);
    setNewNoteTitle('');
  };

  const handleSelectNote = (note: Note) => {
    selectNote(note);
    setText(note.content);
    setShowNoteList(false);
  };

  const handleDeleteNote = async (noteId: string) => {
    await deleteNote(noteId);
    if (currentNote?.id === noteId) {
      setText('');
    }
  };

  const handleBackToList = () => {
    setShowNoteList(true);
    clearCurrentNote();
    setText('');
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type === 'text/markdown' || file.name.endsWith('.md')) {
      try {
        const content = await file.text();
        const fileName = file.name.replace('.md', '');

        const note = await createNoteHook(fileName);
        if (note) {
          await updateNote(note.id, content);
        } else {
          alert('노트 생성에 실패했습니다.');
        }
      } catch (error) {
        console.error('File upload error:', error);
        alert('파일 업로드 중 오류가 발생했습니다.');
      }
    } else {
      alert('마크다운 파일(.md)만 업로드할 수 있습니다.');
    }

    event.target.value = '';
  };

  const handleTitleEdit = () => {
    if (currentNote) {
      setEditingTitle(currentNote.title);
      setIsEditingTitle(true);
    }
  };

  const handleTitleSave = async () => {
    if (currentNote && editingTitle.trim()) {
      await updateNoteTitle(currentNote.id, editingTitle.trim());
    }
    setIsEditingTitle(false);
    setEditingTitle('');
  };

  const handleTitleCancel = () => {
    setIsEditingTitle(false);
    setEditingTitle('');
  };

  useEffect(() => {
    const initializeData = async () => {
      try {
        const result = await chromeStorage.get(['mdScreen']);

        if (result.mdScreen) {
          setMdScreen(result.mdScreen as MdScreen);
        } else {
          setMdScreen('edit');
          await chromeStorage.set({ mdScreen: 'edit' });
        }

        if (process.env.NODE_ENV === 'development') {
          debugStorage();
        }
      } catch (error) {
        console.error('chromeStorage 로드 실패:', error);
      }
    };

    initializeData();
  }, []);

  useEffect(() => {
    if (text === undefined || !currentNote) return;

    const timer = setTimeout(async () => {
      await updateNote(currentNote.id, text);
    }, 230);

    return () => clearTimeout(timer);
  }, [text, currentNote, updateNote]);

  return (
    <div
      className={`panel ${theme}`}
      data-color-mode={theme}
      style={
        {
          '--editor-font-size': `${fontSize}px`,
          fontSize: `${fontSize}px`
        } as React.CSSProperties
      }
    >
      {storageError && (
        <div className="storage-error">
          ⚠️ 저장 용량이 초과되어 내용이 저장되지 않았습니다. 텍스트를
          줄여주세요.
          <button onClick={dismissStorageError}>×</button>
        </div>
      )}
      
      <Toolbar
        theme={theme}
        fontSize={fontSize}
        minFontSize={MIN_FONT_SIZE}
        maxFontSize={MAX_FONT_SIZE}
        showNoteList={showNoteList}
        currentNote={currentNote}
        isEditingTitle={isEditingTitle}
        editingTitle={editingTitle}
        isCopiedEmail={isCopiedEmail}
        onThemeToggle={toggleTheme}
        onBackToList={handleBackToList}
        onDownload={downloadMarkdown}
        onFileUpload={handleFileUpload}
        onFontSizeChange={updateFontSize}
        onTitleEdit={handleTitleEdit}
        onTitleSave={handleTitleSave}
        onTitleCancel={handleTitleCancel}
        onTitleChange={setEditingTitle}
        onEmailCopy={handleCopyEmail}
      />
      
      <div className="editor-container">
        {showNoteList ? (
          <NotesList
            notes={notes}
            onSelectNote={handleSelectNote}
            onDeleteNote={handleDeleteNote}
            onCreateNote={() => setShowCreateModal(true)}
          />
        ) : (
          <NoteEditor
            value={text || ''}
            onChange={setText}
            theme={theme}
            fontSize={fontSize}
            mdScreen={mdScreen}
          />
        )}
      </div>

      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onConfirm={handleCreateNote}
        title="새 노트 만들기"
        placeholder="제목 (비워두면 날짜/시간으로 설정)"
        value={newNoteTitle}
        onChange={setNewNoteTitle}
      />
    </div>
  );
}

export default App;
