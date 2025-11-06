import { useEditor, EditorContent } from '@tiptap/react'
import { BubbleMenu } from '@tiptap/extension-bubble-menu'
import StarterKit from '@tiptap/starter-kit'
import { useSocket } from '@/contexts/SocketContext'
import { useEffect } from 'react'
import SlashCommand from './slash-command'

const Editor = () => {
  const { fileContent, editContent, fileId, onFileUpdate } = useSocket()

  const editor = useEditor({
    extensions: [
      StarterKit,
      BubbleMenu.configure({
        element: document.querySelector('.bubble-menu') as HTMLElement | null,
      }),
      SlashCommand,
    ],
    content: fileContent,
    onUpdate: ({ editor }) => {
      if (fileId) {
        editContent(fileId, editor.getHTML())
      }
    },
  })

  useEffect(() => {
    onFileUpdate((newContent: string) => {
      if (editor && editor.getHTML() !== newContent) {
        editor.commands.setContent(newContent)
      }
    })
  }, [editor, onFileUpdate])

  useEffect(() => {
    if (editor && editor.getHTML() !== fileContent) {
      editor.commands.setContent(fileContent)
    }
  }, [fileContent, editor])

  return (
    <>
      <div className="bubble-menu">
        <button>Bold</button>
        <button>Italic</button>
        <button>Strike</button>
      </div>
      <EditorContent editor={editor} />
    </>
  )
}

export default Editor
