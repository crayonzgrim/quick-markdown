import MDEditor, { commands } from '@uiw/react-md-editor';
// import { Allotment } from 'allotment';
import 'allotment/dist/style.css';
import { useEffect, useState } from 'react';
import rehypeExternalLinks from 'rehype-external-links';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import './index.css';
import { getCurrentFormattedTime } from './utils/getCurrentFormattedTime';
import {
  createNote,
  deleteNote,
  getConfig,
  getContent,
  getNotes,
  migrateFromLocalStorage,
  setConfig,
  setContent,
  updateNote,
  updateNoteTitle,
  type Note
} from './utils/storage';

const customSchema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    a: [...(defaultSchema.attributes?.a || []), 'target', 'rel']
  }
};

function App() {
  /** Property */
  const [text, setText] = useState<string | undefined>('');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [fontSize, setFontSize] = useState(14);
  const [storageError, setStorageError] = useState(false);
  const [notes, setNotes] = useState<Note[]>([]);
  const [currentNote, setCurrentNote] = useState<Note | null>(null);
  const [showNoteList, setShowNoteList] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editingTitle, setEditingTitle] = useState('');

  const MIN_FONT_SIZE = 4;
  const MAX_FONT_SIZE = 100;

  /** Function */
  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const closePanel = () => {
    window.parent.postMessage({ type: 'markdown-panel-close' }, '*');
  };

  const downloadMarkdown = () => {
    const title = currentNote?.title || getCurrentFormattedTime();
    const filename = `${title}.md`;

    window.parent.postMessage(
      { type: 'download-markdown', content: text, filename },
      '*'
    );
  };

  const handleCreateNote = async () => {
    try {
      console.log('Creating note with title:', newNoteTitle);
      const note = await createNote(newNoteTitle || undefined);
      console.log('Created note:', note);

      if (note) {
        const updatedNotes = await getNotes();
        console.log('Updated notes:', updatedNotes);
        setNotes(updatedNotes);
        setCurrentNote(note);
        setText(note.content);
        setShowNoteList(false);
      } else {
        console.error('Failed to create note');
        alert('노트 생성에 실패했습니다. 저장 공간을 확인해주세요.');
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Create note error:', error.message);
      }

      alert('노트 생성 중 오류가 발생했습니다: ');
    }
    setShowCreateModal(false);
    setNewNoteTitle('');
  };

  const handleSelectNote = (note: Note) => {
    setCurrentNote(note);
    setText(note.content);
    setShowNoteList(false);
  };

  const handleDeleteNote = async (noteId: string) => {
    const success = await deleteNote(noteId);
    if (success) {
      const updatedNotes = await getNotes();
      setNotes(updatedNotes);
      if (currentNote?.id === noteId) {
        setCurrentNote(null);
        setText('');
      }
    }
  };

  const handleBackToList = () => {
    setShowNoteList(true);
    setCurrentNote(null);
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

        const note = await createNote(fileName);
        if (note) {
          await updateNote(note.id, content);
          const updatedNotes = await getNotes();
          setNotes(updatedNotes);
          alert(`"${fileName}" 노트가 생성되었습니다.`);
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

    // 파일 input 초기화
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
      const success = await updateNoteTitle(
        currentNote.id,
        editingTitle.trim()
      );
      if (success) {
        setCurrentNote({ ...currentNote, title: editingTitle.trim() });
        const updatedNotes = await getNotes();
        setNotes(updatedNotes);
      } else {
        alert('제목 저장에 실패했습니다.');
      }
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
      // 마이그레이션 먼저 실행
      await migrateFromLocalStorage();

      // 노트 목록 로드
      const savedNotes = await getNotes();
      setNotes(savedNotes);

      // 기존 에디터 내용이 있다면 새 노트로 마이그레이션
      const savedText = await getContent('editor-content', '');
      if (savedText && savedNotes.length === 0) {
        const note = await createNote('이전 메모');
        if (note) {
          await updateNote(note.id, savedText);
          const updatedNotes = await getNotes();
          setNotes(updatedNotes);
        }
        // 기존 에디터 내용 삭제
        await setContent('editor-content', '');
      }

      // 폰트 사이즈 로드
      const savedFontSize = await getConfig('font-size', '14');
      if (savedFontSize) {
        const size = parseInt(savedFontSize.toString());
        setFontSize(Math.max(MIN_FONT_SIZE, Math.min(size, MAX_FONT_SIZE)));
      }
    };

    initializeData();
  }, [MIN_FONT_SIZE, MAX_FONT_SIZE]);

  useEffect(() => {
    if (text === undefined || !currentNote) return;

    const timer = setTimeout(async () => {
      const success = await updateNote(currentNote.id, text);
      setStorageError(!success);
      if (!success) {
        console.warn('노트 저장에 실패했습니다. 용량 제한을 확인해주세요.');
      } else {
        // 노트 목록에서 업데이트된 시간 반영
        const updatedNotes = await getNotes();
        setNotes(updatedNotes);
      }
    }, 500); // 500ms 디바운스

    return () => clearTimeout(timer);
  }, [text, currentNote]);

  /** Render */
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
          <button onClick={() => setStorageError(false)}>×</button>
        </div>
      )}
      <div className="toolbar">
        {!showNoteList && (
          <button
            onClick={handleBackToList}
            style={{ background: 'transparent' }}
          >
            ←
          </button>
        )}
        <button onClick={toggleTheme} style={{ background: 'transparent' }}>
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
        {currentNote && (
          <button
            onClick={downloadMarkdown}
            style={{ background: 'transparent' }}
          >
            ⬇️
          </button>
        )}
        <div className="spacer" />
        <div id="logo">
          {showNoteList ? (
            'Notes'
          ) : isEditingTitle ? (
            <div className="title-edit">
              <input
                type="text"
                value={editingTitle}
                onChange={(e) => setEditingTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleTitleSave();
                  if (e.key === 'Escape') handleTitleCancel();
                }}
                onBlur={handleTitleSave}
                autoFocus
              />
            </div>
          ) : (
            <span
              onClick={handleTitleEdit}
              style={{ cursor: 'pointer' }}
              title="클릭하여 제목 수정"
            >
              {currentNote?.title || 'Markdown Panel'}
            </span>
          )}
        </div>
        <div className="spacer" />
        <label
          style={{
            background: 'transparent',
            cursor: 'pointer',
            padding: '4px 8px'
          }}
        >
          📁
          <input
            type="file"
            accept=".md"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />
        </label>
        <div style={{ position: 'relative' }}>
          <button
            popoverTarget="popover"
            popoverTargetAction="toggle"
            style={{ background: 'transparent' }}
          >
            ⚙️
          </button>
          <div id="popover" popover="auto">
            <div className="popover-item">
              <label>Font size:</label>
              <div className="input-group">
                <input
                  type="number"
                  min={MIN_FONT_SIZE}
                  max={MAX_FONT_SIZE}
                  value={fontSize}
                  onChange={(e) => {
                    const inputValue = e.target.value;
                    if (inputValue === '') {
                      setFontSize(MIN_FONT_SIZE);
                      setConfig('font-size', MIN_FONT_SIZE.toString());
                      return;
                    }
                    const numValue = parseInt(inputValue);
                    if (isNaN(numValue)) return;

                    const newSize = Math.max(
                      MIN_FONT_SIZE,
                      Math.min(numValue, MAX_FONT_SIZE)
                    );
                    setFontSize(newSize);
                    setConfig('font-size', newSize.toString());
                  }}
                />
                <span>px</span>
              </div>
            </div>
            <div className="popover-item">
              <label>Contact:</label>
              <div className="contact-info">
                <span>crayonzgrim@gmail.com</span>
                <button>📋</button>
              </div>
            </div>
          </div>
        </div>
        <button onClick={closePanel} style={{ background: 'transparent' }}>
          ❌
        </button>
      </div>
      <div className="editor-container">
        {showNoteList ? (
          <div className="notes-list">
            <div className="notes-header">
              <button
                className="create-note-btn"
                onClick={() => setShowCreateModal(true)}
              >
                + 새 노트
              </button>
            </div>
            <div className="notes-items">
              {notes.length === 0 ? (
                <div className="empty-notes">
                  노트가 없습니다. 새 노트를 만들어보세요!
                </div>
              ) : (
                notes.map((note) => (
                  <div
                    key={note.id}
                    className="note-item"
                    onClick={() => handleSelectNote(note)}
                  >
                    <div className="note-title">{note.title}</div>
                    <div className="note-preview">
                      {note.content.substring(0, 100) || '내용 없음'}
                    </div>
                    <div className="note-meta">
                      <span className="note-date">
                        {new Date(note.updatedAt).toLocaleString('ko-KR')}
                      </span>
                      <button
                        className="delete-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteNote(note.id);
                        }}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          <MDEditor
            value={text}
            onChange={setText}
            height="100%"
            preview="live"
            autoFocus={true}
            data-color-mode={theme}
            style={{ fontSize: `${fontSize}px` }}
            previewOptions={{
              rehypePlugins: [
                [
                  rehypeExternalLinks,
                  { target: '_blank', rel: ['noopener', 'noreferrer'] }
                ],
                [rehypeSanitize, customSchema]
              ]
            }}
            commands={[
              commands.group(
                [
                  commands.title1,
                  commands.title2,
                  commands.title3,
                  commands.title4,
                  commands.title5,
                  commands.title6
                ],
                {
                  name: 'title',
                  groupName: 'Title',
                  buttonProps: { 'aria-label': 'Insert title' }
                }
              ),
              commands.divider,
              commands.bold,
              commands.italic,
              commands.strikethrough,
              commands.hr,
              commands.quote,
              commands.orderedListCommand,
              commands.checkedListCommand,
              commands.divider,
              commands.link,
              commands.image,
              commands.code,
              commands.comment,
              commands.table,
              commands.divider,
              commands.issue,
              commands.help
            ]}
          />
        )}
      </div>

      {/* 노트 생성 모달 */}
      {showCreateModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowCreateModal(false)}
        >
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>새 노트 만들기</h3>
            <input
              type="text"
              placeholder="제목 (비워두면 날짜/시간으로 설정)"
              value={newNoteTitle}
              onChange={(e) => setNewNoteTitle(e.target.value)}
              autoFocus
            />
            <div className="modal-buttons">
              <button onClick={() => setShowCreateModal(false)}>취소</button>
              <button onClick={handleCreateNote}>생성</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
