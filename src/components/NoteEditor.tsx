import MDEditor, { commands } from '@uiw/react-md-editor';
import rehypeExternalLinks from 'rehype-external-links';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import type { Theme, MdScreen } from '../types';

const customSchema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    a: [...(defaultSchema.attributes?.a || []), 'target', 'rel']
  }
};

interface NoteEditorProps {
  value: string;
  onChange: (value: string | undefined) => void;
  theme: Theme;
  fontSize: number;
  mdScreen: MdScreen;
}

export const NoteEditor: React.FC<NoteEditorProps> = ({
  value,
  onChange,
  theme,
  fontSize,
  mdScreen
}) => {
  return (
    <MDEditor
      value={value}
      onChange={onChange}
      height="100%"
      preview={mdScreen ?? 'edit'}
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
  );
};