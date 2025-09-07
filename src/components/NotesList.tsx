import React from 'react';
import type { Note } from '../types';

// BlockNote 타입 정의
interface BlockNoteContent {
  type: string;
  text?: string;
}

interface BlockNoteBlock {
  id: string;
  type: string;
  props?: Record<string, unknown>;
  content?: BlockNoteContent[];
}

interface NotesListProps {
  notes: Note[];
  onSelectNote: (note: Note) => void;
  onDeleteNote: (noteId: string) => void;
  onCreateNote: () => void;
}

export const NotesList: React.FC<NotesListProps> = ({
  notes,
  onSelectNote,
  onDeleteNote,
  onCreateNote
}) => {
  const extractTextFromBlocks = (blocksJson: string): string => {
    try {
      const blocks = JSON.parse(blocksJson);
      if (!Array.isArray(blocks)) {
        return blocksJson.substring(0, 100);
      }

      return (blocks as BlockNoteBlock[])
        .map((block) => {
          if (block.content && Array.isArray(block.content)) {
            return block.content
              .filter((content) => content.type === 'text')
              .map((content) => content.text || '')
              .join('');
          }
          return '';
        })
        .join(' ')
        .trim();
    } catch {
      return blocksJson.substring(0, 100);
    }
  };

  return (
    <div className="notes-list">
      <div className="notes-header">
        <button className="create-note-btn" onClick={onCreateNote}>
          + 새 노트
        </button>
      </div>
      <div className="notes-items">
        {notes.length === 0 ? (
          <div className="empty-notes">
            노트가 없습니다. <br /> 새 노트를 만들어보세요!
          </div>
        ) : (
          notes.map((note) => (
            <div
              key={note.id}
              className="note-item"
              onClick={() => onSelectNote(note)}
            >
              <div className="note-title">{note.title}</div>
              <div className="note-preview">
                {extractTextFromBlocks(note.content).substring(0, 100) ||
                  '내용 없음'}
              </div>
              <div className="note-meta">
                <span className="note-date">
                  {new Date(note.updatedAt).toLocaleString('ko-KR')}
                </span>
                <button
                  className="delete-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteNote(note.id);
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
  );
};
