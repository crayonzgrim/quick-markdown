import MDEditor, { commands } from '@uiw/react-md-editor';
import { Allotment } from 'allotment';
import 'allotment/dist/style.css';
import { useEffect, useState } from 'react';
import rehypeExternalLinks from 'rehype-external-links';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import './index.css';
import { getCurrentFormattedTime } from './utils/getCurrentFormattedTime';
import {
  getConfig,
  getContent,
  migrateFromLocalStorage,
  setConfig,
  setContent
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
    const title = getCurrentFormattedTime();
    const filename = title ?? 'note.md';

    window.parent.postMessage(
      { type: 'download-markdown', content: text, filename },
      '*'
    );
  };

  useEffect(() => {
    const initializeData = async () => {
      // 마이그레이션 먼저 실행
      await migrateFromLocalStorage();

      // 에디터 내용 로드
      const savedText = await getContent('editor-content', '');
      if (savedText) setText(savedText);

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
    if (text !== undefined) {
      setContent('editor-content', text);
    }
  }, [text]);

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
      <div className="toolbar">
        <button onClick={toggleTheme} style={{ background: 'transparent' }}>
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
        <button
          onClick={downloadMarkdown}
          style={{ background: 'transparent' }}
        >
          ⬇️
        </button>
        <div className="spacer" />
        <div id="logo">Markdown Panel</div>
        <div className="spacer" />
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
        <Allotment defaultSizes={[500, 500]}>
          <MDEditor
            value={text}
            onChange={setText}
            height="100%"
            preview="edit"
            autoFocus={true}
            data-color-mode={theme}
            style={{
              fontSize: `${fontSize}px`
            }}
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
          <MDEditor.Markdown
            source={text}
            style={{
              padding: '8px 16px 40px 16px',
              fontSize: `${fontSize}px`,
              height: '100%',
              overflow: 'auto'
            }}
            rehypePlugins={[
              [
                rehypeExternalLinks,
                { target: '_blank', rel: ['noopener', 'noreferrer'] }
              ],
              [rehypeSanitize, customSchema]
            ]}
          />
        </Allotment>
      </div>
    </div>
  );
}

export default App;
