"use client";

import "tippy.js/dist/tippy.css";

import { useMemo, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import { BubbleMenu, FloatingMenu } from "@tiptap/react/menus";
import DragHandle from "@tiptap/extension-drag-handle";
import Highlight from "@tiptap/extension-highlight";
import HorizontalRule from "@tiptap/extension-horizontal-rule";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import StarterKit from "@tiptap/starter-kit";
import TaskItem from "@tiptap/extension-task-item";
import TaskList from "@tiptap/extension-task-list";
import TextAlign from "@tiptap/extension-text-align";
import Typography from "@tiptap/extension-typography";
import Underline from "@tiptap/extension-underline";
import { SlashCommand } from "@/components/editor/slash-command";
import { EditorToolbar } from "@/components/editor/editor-toolbar";
import { offset, flip, shift } from "@floating-ui/dom";

import { cn } from "@/lib/utils";
import {
  Bold,
  Heading1,
  Highlighter as HighlighterIcon,
  Italic,
  Link2,
  List,
  ListTodo,
  Strikethrough,
  Text as TextIcon,
  Underline as UnderlineIcon,
} from "lucide-react";

type InlineBubbleButtonProps = {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  active: boolean;
};

type FloatingMenuButtonProps = {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  active?: boolean;
};

function InlineBubbleButton({ label, icon: Icon, onClick, active }: InlineBubbleButtonProps) {
  return (
    <button
      type="button"
      title={label}
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-md border border-transparent bg-background text-sm shadow-sm transition",
        "hover:bg-accent hover:text-accent-foreground",
        active && "bg-accent text-accent-foreground"
      )}
    >
      <Icon className="h-4 w-4" />
      <span className="sr-only">{label}</span>
    </button>
  );
}

function FloatingMenuButton({ label, icon: Icon, onClick, active }: FloatingMenuButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex w-48 items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition",
        "hover:bg-accent hover:text-accent-foreground",
        active && "bg-accent text-accent-foreground"
      )}
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-md bg-muted text-foreground">
        <Icon className="h-4 w-4" />
      </span>
      <span>{label}</span>
    </button>
  );
}

export function Editor() {
  const [title, setTitle] = useState("Untitled document");

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4],
        },
        dropcursor: {
          color: "hsl(var(--primary))",
          width: 2,
        },
        horizontalRule: false,
      }),
      Placeholder.configure({
        placeholder: "Type / for commands or start writing...",
      }),
      Underline,
      Link.configure({
        autolink: true,
        linkOnPaste: true,
        openOnClick: false,
      }),
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      TaskList.configure({
        HTMLAttributes: {
          class: "not-prose space-y-2",
        },
      }),
      TaskItem.configure({
        nested: true,
        HTMLAttributes: {
          class: "flex items-start gap-3",
        },
      }),
      HorizontalRule,
      Typography,
      SlashCommand,
      DragHandle.configure({
        render: () => {
          const element = document.createElement('div');
          element.classList.add('drag-handle');
          element.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="7" r="1" fill="currentColor" /><circle cx="9" cy="12" r="1" fill="currentColor" /><circle cx="9" cy="17" r="1" fill="currentColor" /><circle cx="15" cy="7" r="1" fill="currentColor" /><circle cx="15" cy="12" r="1" fill="currentColor" /><circle cx="15" cy="17" r="1" fill="currentColor" /></svg>';
          return element;
        },
        computePositionConfig: {
          placement: 'left',
          middleware: [offset(12), flip(), shift()],
        },
      }),
    ],
    autofocus: "end",
    editorProps: {
      attributes: {
        class: "tiptap prose prose-neutral max-w-none text-base leading-relaxed focus:outline-none dark:prose-invert",
      },
    },
    content: "",
  });

  const handleSetLink = () => {
    if (!editor) {
      return;
    }
    const previousUrl = editor.getAttributes("link").href ?? "";
    const url = window.prompt("Enter a URL", previousUrl);
    if (url === null) {
      return;
    }
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  const floatingShouldShow = useMemo(() => {
    if (!editor) {
      return () => false;
    }
    return () => {
      const { state } = editor;
      const { $from } = state.selection;
      const isRootDepth = $from.depth === 1;
      const isParagraph = $from.parent.type.name === "paragraph";
      const isEmpty = $from.parent.textContent.length === 0;
      return isRootDepth && isParagraph && isEmpty;
    };
  }, [editor]);

  return (
    <div className="flex h-full flex-col overflow-hidden bg-muted/20">
      <div className="border-b bg-background px-6 py-4">
        <div className="mx-auto flex max-w-3xl flex-col gap-4">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Document</p>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Untitled document"
              className="w-full bg-transparent text-3xl font-semibold tracking-tight text-foreground outline-none"
            />
          </div>
          <EditorToolbar editor={editor} />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="mx-auto max-w-3xl space-y-6">
          {editor && (
            <BubbleMenu editor={editor} className="z-50" options={{ placement: 'bottom' }}>
              <div className="flex items-center gap-1 rounded-md border bg-background p-1 shadow-lg">
                <InlineBubbleButton
                  label="Bold"
                  icon={Bold}
                  active={editor.isActive("bold")}
                  onClick={() => editor.chain().focus().toggleBold().run()}
                />
                <InlineBubbleButton
                  label="Italic"
                  icon={Italic}
                  active={editor.isActive("italic")}
                  onClick={() => editor.chain().focus().toggleItalic().run()}
                />
                <InlineBubbleButton
                  label="Underline"
                  icon={UnderlineIcon}
                  active={editor.isActive("underline")}
                  onClick={() => editor.chain().focus().toggleUnderline().run()}
                />
                <InlineBubbleButton
                  label="Strike"
                  icon={Strikethrough}
                  active={editor.isActive("strike")}
                  onClick={() => editor.chain().focus().toggleStrike().run()}
                />
                <InlineBubbleButton
                  label="Highlight"
                  icon={HighlighterIcon}
                  active={editor.isActive("highlight")}
                  onClick={() => editor.chain().focus().toggleHighlight().run()}
                />
                <InlineBubbleButton
                  label="Link"
                  icon={Link2}
                  active={editor.isActive("link")}
                  onClick={handleSetLink}
                />
              </div>
            </BubbleMenu>
          )}
          {editor && (
            <FloatingMenu editor={editor} shouldShow={floatingShouldShow} className="z-50" options={{placement : "bottom-start"}}>
              <div className="flex flex-col gap-1 rounded-md border bg-background p-2 shadow-lg">
                <FloatingMenuButton
                  label="Text"
                  icon={TextIcon}
                  active={editor.isActive("paragraph")}
                  onClick={() => editor.chain().focus().setParagraph().run()}
                />
                <FloatingMenuButton
                  label="Heading 1"
                  icon={Heading1}
                  active={editor.isActive("heading", { level: 1 })}
                  onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                />
                <FloatingMenuButton
                  label="Bullet list"
                  icon={List}
                  active={editor.isActive("bulletList")}
                  onClick={() => editor.chain().focus().toggleBulletList().run()}
                />
                <FloatingMenuButton
                  label="Task list"
                  icon={ListTodo}
                  active={editor.isActive("taskList")}
                  onClick={() => editor.chain().focus().toggleTaskList().run()}
                />
              </div>
            </FloatingMenu>
          )}
          <EditorContent editor={editor} />
        </div>
      </div>
    </div>
  );
}
