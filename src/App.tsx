import MDEditor, { commands } from '@uiw/react-md-editor';
import { useEffect, useState } from 'react';
import rehypeExternalLinks from 'rehype-external-links';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import './index.css';

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
    if (text === undefined) return;
    const firstLine = text
      .split('\n')[0]
      .replace(/[#*[/\\]{}|]/g, '')
      .trim();
    const filename = firstLine ? `${firstLine}.md` : 'note.md';

    window.parent.postMessage(
      { type: 'download-markdown', content: text, filename },
      '*'
    );
  };

  useEffect(() => {
    const loadContent = async () => {
      if (chrome?.storage?.local) {
        const result = await chrome.storage.local.get([STORAGE_KEY]);
        if (result[STORAGE_KEY]) setText(result[STORAGE_KEY]);
      } else {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) setText(saved);
      }
    };
    loadContent();
  }, []);

  useEffect(() => {
    const saveContent = async () => {
      if (text !== undefined) {
        if (chrome?.storage?.local) {
          await chrome.storage.local.set({ [STORAGE_KEY]: text });
        } else {
          localStorage.setItem(STORAGE_KEY, text);
        }
      }
    };
    saveContent();
  }, [text]);

  return (
    <div className={`panel ${theme}`} data-color-mode={theme}>
      <div className="toolbar">
        <button onClick={toggleTheme}>{theme === 'dark' ? '☀️' : '🌙'}</button>
        <button onClick={downloadMarkdown}>⬇️</button>
        <div className="spacer" />
        <button onClick={closePanel}>❌</button>
      </div>
      <div className="editor-container">
        <MDEditor
          value={text}
          onChange={setText}
          height="100%"
          preview="live"
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
            commands.divider,
            commands.issue,
            commands.help
          ]}
        />
      </div>
    </div>
  );
}

export default App;
