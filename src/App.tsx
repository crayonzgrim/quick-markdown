import 'allotment/dist/style.css';
import { useEffect, useState } from 'react';
import { Modal, NoteEditor, NotesList, Toolbar } from './components';
import { useFontSize, useNotes, useTheme } from './hooks';
import './index.css';
import type { Note } from './types';
import { debugStorage } from './utils/chromeStorage';

// BlockNote 타입 정의
interface BlockNoteContent {
  type: string;
  text?: string;
}

interface BlockNoteBlock {
  id: string;
  type: string;
  props?: {
    level?: number;
    checked?: boolean;
    language?: string;
    [key: string]: unknown;
  };
  content?: BlockNoteContent[];
}

function App() {
  const { theme, toggleTheme } = useTheme();
  const { fontSize, updateFontSize, MIN_FONT_SIZE, MAX_FONT_SIZE } =
    useFontSize();
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

  const convertBlocksToMarkdown = (blocksJson: string): string => {
    try {
      const blocks: unknown = JSON.parse(blocksJson);
      if (!Array.isArray(blocks)) {
        return blocksJson;
      }

      return (blocks as BlockNoteBlock[])
        .map((block) => {
          switch (block.type) {
            case 'heading': {
              const level = block.props?.level || 1;
              return `${'#'.repeat(level)} ${block.content?.[0]?.text || ''}`;
            }
            case 'paragraph':
              return block.content?.[0]?.text || '';
            case 'bulletListItem':
              return `- ${block.content?.[0]?.text || ''}`;
            case 'numberedListItem':
              return `1. ${block.content?.[0]?.text || ''}`;
            case 'checkListItem': {
              const checked = block.props?.checked ? 'x' : ' ';
              return `- [${checked}] ${block.content?.[0]?.text || ''}`;
            }
            case 'codeBlock': {
              const language = block.props?.language || '';
              return `\`\`\`${language}\n${block.content?.[0]?.text || ''}\n\`\`\``;
            }
            default:
              return block.content?.[0]?.text || '';
          }
        })
        .join('\n\n');
    } catch (error) {
      console.warn('Failed to convert blocks to markdown:', error);
      return blocksJson;
    }
  };

  const downloadMarkdown = () => {
    if (!text || !currentNote) return;

    const title = currentNote.title || new Date().toLocaleString('ko-KR');
    const filename = `${title}.md`;

    const markdownContent = convertBlocksToMarkdown(text);
    const blob = new Blob([markdownContent], {
      type: 'text/markdown;charset=utf-8'
    });
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

  const convertMarkdownToBlocks = (markdown: string): string => {
    const lines = markdown.split('\n');
    const blocks: BlockNoteBlock[] = [];

    for (const line of lines) {
      if (line.trim() === '') {
        continue;
      }

      if (line.startsWith('# ')) {
        blocks.push({
          id: `block_${Date.now()}_${Math.random()}`,
          type: 'heading',
          props: { level: 1 },
          content: [{ type: 'text', text: line.substring(2) }]
        });
      } else if (line.startsWith('## ')) {
        blocks.push({
          id: `block_${Date.now()}_${Math.random()}`,
          type: 'heading',
          props: { level: 2 },
          content: [{ type: 'text', text: line.substring(3) }]
        });
      } else if (line.startsWith('### ')) {
        blocks.push({
          id: `block_${Date.now()}_${Math.random()}`,
          type: 'heading',
          props: { level: 3 },
          content: [{ type: 'text', text: line.substring(4) }]
        });
      } else if (line.startsWith('- [ ]')) {
        blocks.push({
          id: `block_${Date.now()}_${Math.random()}`,
          type: 'checkListItem',
          props: { checked: false },
          content: [{ type: 'text', text: line.substring(5).trim() }]
        });
      } else if (line.startsWith('- [x]')) {
        blocks.push({
          id: `block_${Date.now()}_${Math.random()}`,
          type: 'checkListItem',
          props: { checked: true },
          content: [{ type: 'text', text: line.substring(5).trim() }]
        });
      } else if (line.startsWith('- ')) {
        blocks.push({
          id: `block_${Date.now()}_${Math.random()}`,
          type: 'bulletListItem',
          content: [{ type: 'text', text: line.substring(2) }]
        });
      } else {
        blocks.push({
          id: `block_${Date.now()}_${Math.random()}`,
          type: 'paragraph',
          content: [{ type: 'text', text: line }]
        });
      }
    }

    return JSON.stringify(blocks);
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type === 'text/markdown' || file.name.endsWith('.md')) {
      try {
        const markdownContent = await file.text();
        const fileName = file.name.replace('.md', '');
        const blocksContent = convertMarkdownToBlocks(markdownContent);

        const note = await createNoteHook(fileName);
        if (note) {
          await updateNote(note.id, blocksContent);
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
