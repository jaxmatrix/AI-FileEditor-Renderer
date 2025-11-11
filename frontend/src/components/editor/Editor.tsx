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
    <div className="h-full overflow-auto p-6">
      <div className="bubble-menu items-center gap-1 rounded-md border bg-popover px-2 py-1 text-sm text-popover-foreground shadow-md">
        <button className="rounded px-2 py-1 hover:bg-accent hover:text-accent-foreground">Bold</button>
        <button className="rounded px-2 py-1 hover:bg-accent hover:text-accent-foreground">Italic</button>
        <button className="rounded px-2 py-1 hover:bg-accent hover:text-accent-foreground">Strike</button>
      </div>
      <div className="rounded-lg border bg-card p-4">
        <EditorContent editor={editor} className="prose prose-zinc dark:prose-invert max-w-none focus:outline-none" />
      </div>
    </div>
  )
}

export default Editor
