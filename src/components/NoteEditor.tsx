import '@blocknote/core/fonts/inter.css';
import { BlockNoteView } from '@blocknote/mantine';
import '@blocknote/mantine/style.css';
import { useCreateBlockNote } from '@blocknote/react';
import { useEffect, useMemo } from 'react';
import type { Theme } from '../types';

interface NoteEditorProps {
  value: string;
  onChange: (value: string | undefined) => void;
  theme: Theme;
  fontSize: number;
}

export const NoteEditor: React.FC<NoteEditorProps> = ({
  value,
  onChange,
  theme,
  fontSize
}) => {
  // 초기 콘텐츠 안전하게 파싱
  const getInitialContent = () => {
    if (!value || value.trim() === '') {
      // 빈 콘텐츠일 때 기본 단락 블록 제공
      return [
        {
          id: 'initial-block',
          type: 'paragraph',
          props: {},
          content: []
        }
      ];
    }

    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
      // 빈 배열이거나 유효하지 않은 경우 기본 블록 반환
      return [
        {
          id: 'default-block',
          type: 'paragraph',
          props: {},
          content: []
        }
      ];
    } catch (error) {
      // 기존 마크다운 형태일 경우 기본 블록으로 변환
      console.warn('Failed to parse initial content:', error);
      return [
        {
          id: `block_${Date.now()}`,
          type: 'paragraph',
          props: {},
          content: [{ type: 'text', text: value }]
        }
      ];
    }
  };

  const editor = useCreateBlockNote({
    initialContent: getInitialContent(),
    trailingBlock: false // trailing block을 비활성화해서 경고 방지
  });

  useEffect(() => {
    const handleChange = async () => {
      const blocks = editor.document;
      const jsonContent = JSON.stringify(blocks);
      onChange(jsonContent);
    };

    // 변경 감지 등록
    return editor.onChange(handleChange);
  }, [editor, onChange]);

  useEffect(() => {
    if (value && value.trim() !== '') {
      try {
        const parsedContent = JSON.parse(value);
        const currentContent = JSON.stringify(editor.document);

        // 내용이 실제로 다를 때만 업데이트
        if (JSON.stringify(parsedContent) !== currentContent) {
          editor.replaceBlocks(editor.document, parsedContent);
        }
      } catch (error) {
        console.warn('Failed to parse BlockNote content:', error);
      }
    }
  }, [value, editor]);

  const editorStyle = useMemo(
    () => ({
      fontSize: `${fontSize}px`
    }),
    [fontSize]
  );

  return (
    <div style={editorStyle}>
      <BlockNoteView editor={editor} theme={theme} style={{ height: '100%' }} />
    </div>
  );
};
