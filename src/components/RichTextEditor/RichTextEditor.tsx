import { RichTextEditor, Link } from "@mantine/tiptap";
import { useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Box, Text } from "@mantine/core";
import { useEffect } from "react";
import TextAlign from "@tiptap/extension-text-align";
import Document from "@tiptap/extension-document";
import { BulletList, ListItem } from "@tiptap/extension-list";
import Paragraph from "@tiptap/extension-paragraph";

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  label?: string;
  placeholder?: string;
}

export default function CustomRichTextEditor({
  content,
  onChange,
  label,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ link: false }),
      Link,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      BulletList,
      ListItem,
      Document,
      Paragraph,
    ],
    content,
    immediatelyRender: false,
    onUpdate({ editor }) {
      onChange(editor.getHTML());
    },
  });
  useEffect(() => {
    if (editor && content && editor.getHTML() !== content) {
      editor.commands.setContent(content, {
        emitUpdate: false,
      });
    }
  }, [editor, content]);
  return (
    <Box>
      {label && (
        <Text size="sm" fw={500} mb={3}>
          {label}
        </Text>
      )}
      <RichTextEditor
        editor={editor}
        variant="subtle"
        styles={{
          content: {
            minHeight: "200px",
          },
        }}
      >
        <RichTextEditor.Toolbar sticky stickyOffset={60}>
          <RichTextEditor.ControlsGroup>
            <RichTextEditor.Bold />
            <RichTextEditor.Italic />
            <RichTextEditor.Underline />
            <RichTextEditor.Strikethrough />
            <RichTextEditor.ClearFormatting />
            <RichTextEditor.Highlight />
          </RichTextEditor.ControlsGroup>

          <RichTextEditor.ControlsGroup>
            <RichTextEditor.H1 />
            <RichTextEditor.H2 />
            <RichTextEditor.H3 />
            <RichTextEditor.H4 />
          </RichTextEditor.ControlsGroup>

          <RichTextEditor.ControlsGroup>
            <RichTextEditor.Blockquote />
            <RichTextEditor.Hr />
            <RichTextEditor.BulletList />
            <RichTextEditor.OrderedList />
          </RichTextEditor.ControlsGroup>

          <RichTextEditor.ControlsGroup>
            <RichTextEditor.AlignLeft />
            <RichTextEditor.AlignCenter />
            <RichTextEditor.AlignJustify />
            <RichTextEditor.AlignRight />
          </RichTextEditor.ControlsGroup>
        </RichTextEditor.Toolbar>

        <RichTextEditor.Content />
      </RichTextEditor>
    </Box>
  );
}
