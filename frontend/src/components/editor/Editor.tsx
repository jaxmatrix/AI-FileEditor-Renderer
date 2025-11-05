import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from '@tiptap/starter-kit';
import { useSocket } from "@/contexts/SocketContext";
import { useEffect } from "react";

const Editor = () => {
  const { fileContent, editContent, fileId, onFileUpdate } = useSocket();

  const editor = useEditor({
    extensions: [StarterKit],
    content: fileContent,
    onUpdate: ({ editor }) => {
      if (fileId) {
        editContent(fileId, editor.getHTML());
      }
    },
  });

  useEffect(() => {
    onFileUpdate((newContent: string) => {
      if (editor && editor.getHTML() !== newContent) {
        editor.commands.setContent(newContent);
      }
    });
  }, [editor, onFileUpdate]);

  useEffect(() => {
    if (editor && editor.getHTML() !== fileContent) {
      editor.commands.setContent(fileContent);
    }
  }, [fileContent, editor]);

  return (
    <>
      <EditorContent editor={editor} />
    </>
  );
};

export default Editor;

