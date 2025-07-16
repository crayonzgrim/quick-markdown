import MDEditor, { commands } from '@uiw/react-md-editor';
import { Allotment } from 'allotment';
import 'allotment/dist/style.css';
import { useEffect, useState } from 'react';
import rehypeExternalLinks from 'rehype-external-links';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import './index.css';
import { getCurrentFormattedTime } from './utils/getCurrentFormattedTime';

const STORAGE_KEY = 'markdown-editor-content';

const customSchema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    a: [...(defaultSchema.attributes?.a || []), 'target', 'rel']
  }
};

function App() {
  const [text, setText] = useState<string | undefined>('');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

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
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setText(saved);
  }, []);

  useEffect(() => {
    if (text !== undefined) {
      localStorage.setItem(STORAGE_KEY, text);
    }
  }, [text]);

  return (
    <div className={`panel ${theme}`} data-color-mode={theme}>
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
        <button onClick={closePanel} style={{ background: 'transparent' }}>
          ❌
        </button>
      </div>
      <div className="editor-container">
        <Allotment defaultSizes={[200, 200]}>
          <MDEditor
            value={text}
            onChange={setText}
            height="100%"
            preview="edit"
            autoFocus={true}
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
