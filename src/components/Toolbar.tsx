import React from 'react';
import type { Theme, Note } from '../types';

interface ToolbarProps {
  theme: Theme;
  fontSize: number;
  minFontSize: number;
  maxFontSize: number;
  showNoteList: boolean;
  currentNote: Note | null;
  isEditingTitle: boolean;
  editingTitle: string;
  isCopiedEmail: boolean;
  onThemeToggle: () => void;
  onBackToList: () => void;
  onDownload: () => void;
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onFontSizeChange: (size: number) => void;
  onTitleEdit: () => void;
  onTitleSave: () => void;
  onTitleCancel: () => void;
  onTitleChange: (title: string) => void;
  onEmailCopy: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  theme,
  fontSize,
  minFontSize,
  maxFontSize,
  showNoteList,
  currentNote,
  isEditingTitle,
  editingTitle,
  isCopiedEmail,
  onThemeToggle,
  onBackToList,
  onDownload,
  onFileUpload,
  onFontSizeChange,
  onTitleEdit,
  onTitleSave,
  onTitleCancel,
  onTitleChange,
  onEmailCopy
}) => {
  return (
    <div className="toolbar">
      {!showNoteList && (
        <button
          onClick={onBackToList}
          style={{ background: 'transparent' }}
        >
          ←
        </button>
      )}
      <button onClick={onThemeToggle} style={{ background: 'transparent' }}>
        {theme === 'dark' ? '☀️' : '🌙'}
      </button>
      {currentNote && (
        <button
          onClick={onDownload}
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
              onChange={(e) => onTitleChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onTitleSave();
                if (e.key === 'Escape') onTitleCancel();
              }}
              onBlur={onTitleSave}
              autoFocus
              style={{
                width: '120px',
                minWidth: '120px',
                maxWidth: '120px'
              }}
            />
          </div>
        ) : (
          <span
            onClick={onTitleEdit}
            title="클릭하여 제목 수정"
            style={{
              width: '120px',
              minWidth: '120px',
              maxWidth: '120px',
              cursor: 'pointer'
            }}
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
          onChange={onFileUpload}
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
            <label>Font Size</label>
            <div className="input-group">
              <input
                type="number"
                min={minFontSize}
                max={maxFontSize}
                value={fontSize}
                onChange={(e) => {
                  const inputValue = e.target.value;
                  if (inputValue === '') {
                    onFontSizeChange(minFontSize);
                    return;
                  }
                  const numValue = parseInt(inputValue);
                  if (isNaN(numValue)) return;

                  const newSize = Math.max(
                    minFontSize,
                    Math.min(numValue, maxFontSize)
                  );
                  onFontSizeChange(newSize);
                }}
              />
              <span>px</span>
            </div>
          </div>
          <div className="popover-item">
            <label>Contact Me</label>
            <div className="contact-info">
              <span>crayonzgrim@gmail.com</span>
              {isCopiedEmail ? (
                <span>✅</span>
              ) : (
                <button onClick={onEmailCopy}>📋</button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};