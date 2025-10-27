"use client";

import { cn } from "@/lib/utils";
import { Extension, type Range } from "@tiptap/core";
import type { Editor } from "@tiptap/react";
import { ReactRenderer } from "@tiptap/react";
import Suggestion, {
  type SuggestionKeyDownProps,
  type SuggestionOptions,
  type SuggestionProps,
} from "@tiptap/suggestion";
import {
  Code2,
  Heading1,
  Heading2,
  Heading3,
  Highlighter,
  Link2,
  List,
  ListOrdered,
  ListTodo,
  Minus,
  Quote,
  Text,
} from "lucide-react";
import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import tippy, { type Instance, type Props } from "tippy.js";

type SlashCommandItem = {
  title: string;
  description: string;
  keywords: string[];
  icon: React.ComponentType<{ className?: string }>;
  action: (props: { editor: Editor; range: Range }) => void;
};

type CommandListProps = SuggestionProps<SlashCommandItem>;

type CommandListHandle = {
  onKeyDown: (props: SuggestionKeyDownProps) => boolean;
};

const baseItems: SlashCommandItem[] = [
  {
    title: "Text",
    description: "Start writing with plain text",
    keywords: ["paragraph", "plain", "text"],
    icon: Text,
    action: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setParagraph().run();
    },
  },
  {
    title: "Heading 1",
    description: "Create a title",
    keywords: ["h1", "title"],
    icon: Heading1,
    action: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setHeading({ level: 1 }).run();
    },
  },
  {
    title: "Heading 2",
    description: "Add a section heading",
    keywords: ["h2"],
    icon: Heading2,
    action: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setHeading({ level: 2 }).run();
    },
  },
  {
    title: "Heading 3",
    description: "Add a smaller heading",
    keywords: ["h3"],
    icon: Heading3,
    action: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setHeading({ level: 3 }).run();
    },
  },
  {
    title: "Bullet list",
    description: "Create a bullet list",
    keywords: ["list", "bullet", "unordered"],
    icon: List,
    action: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBulletList().run();
    },
  },
  {
    title: "Ordered list",
    description: "Create a numbered list",
    keywords: ["list", "ordered", "numbered"],
    icon: ListOrdered,
    action: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleOrderedList().run();
    },
  },
  {
    title: "Task list",
    description: "Track tasks with checkboxes",
    keywords: ["todo", "task", "checkbox"],
    icon: ListTodo,
    action: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleTaskList().run();
    },
  },
  {
    title: "Quote",
    description: "Insert a quote",
    keywords: ["blockquote", "quote"],
    icon: Quote,
    action: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBlockquote().run();
    },
  },
  {
    title: "Code block",
    description: "Capture code snippets",
    keywords: ["code"],
    icon: Code2,
    action: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleCodeBlock().run();
    },
  },
  {
    title: "Highlight",
    description: "Emphasize with color",
    keywords: ["highlight", "mark"],
    icon: Highlighter,
    action: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleHighlight().run();
    },
  },
  {
    title: "Link",
    description: "Insert a link",
    keywords: ["link", "url"],
    icon: Link2,
    action: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).extendMarkRange("link").setLink({ href: "https://" }).run();
    },
  },
  {
    title: "Divider",
    description: "Insert a divider",
    keywords: ["divider", "line", "hr"],
    icon: Minus,
    action: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setHorizontalRule().run();
    },
  },
];

const CommandList = forwardRef<CommandListHandle, CommandListProps>((props, ref) => {
  const { items, command } = props;
  const [selectedIndex, setSelectedIndex] = useState(0);

  const selectItem = (index: number) => {
    const item = items[index];
    if (!item) {
      return;
    }
    command(item);
  };

  useEffect(() => {
    setSelectedIndex(0);
  }, [items]);

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }) => {
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setSelectedIndex((prev) => (prev + items.length - 1) % items.length);
        return true;
      }
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % items.length);
        return true;
      }
      if (event.key === "Enter") {
        event.preventDefault();
        selectItem(selectedIndex);
        return true;
      }
      return false;
    },
  }));

  if (!items.length) {
    return (
      <div className="w-72 rounded-md border bg-popover px-3 py-4 text-sm text-muted-foreground shadow-md">
        No command found
      </div>
    );
  }

  return (
    <div className="w-72 rounded-md border bg-popover p-2 text-popover-foreground shadow-md">
      <ul className="flex flex-col gap-1">
        {items.map((item, index) => {
          const Icon = item.icon;
          const isActive = index === selectedIndex;
          return (
            <li key={item.title}>
              <button
                type="button"
                onClick={() => selectItem(index)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition",
                  isActive ? "bg-accent text-accent-foreground" : "hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-md bg-muted text-foreground">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="flex flex-col">
                  <span className="font-medium">{item.title}</span>
                  <span className="text-xs text-muted-foreground">{item.description}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
});
CommandList.displayName = "CommandList";

export const SlashCommand = Extension.create({
  name: "slash-command",
  addOptions() {
    return {
      suggestion: {
        char: "/",
        items: ({ query }) => {
          if (!query) {
            return baseItems;
          }
          const search = query.toLowerCase();
          return baseItems.filter((item) => {
            return (
              item.title.toLowerCase().includes(search) ||
              item.keywords.some((keyword) => keyword.toLowerCase().includes(search))
            );
          });
        },
        command: ({ editor, range, props }) => {
          props.action({ editor, range });
        },
        allow: ({ state, range }) => {
          const $from = state.doc.resolve(range.from);
          const textBefore = $from.parent.textBetween(0, $from.parentOffset, undefined, "\ufffc");
          return textBefore.length === 0;
        },
        render: () => {
          let component: ReactRenderer<CommandListHandle, CommandListProps> | null = null;
          let popup: Instance<Props> | null = null;
          let getReferenceClientRect: () => DOMRect = () => new DOMRect(0, 0, 0, 0);
          return {
            onStart: (props) => {
              component = new ReactRenderer(CommandList, {
                editor: props.editor,
                props,
              });

              const clientRect = props.clientRect;
              if (!clientRect) {
                return;
              }

              getReferenceClientRect = () => {
                const rect = clientRect();
                if (!rect) {
                  return new DOMRect(0, 0, 0, 0);
                }
                return rect;
              };

              popup = tippy(document.body, {
                getReferenceClientRect,
                appendTo: () => document.body,
                content: component.element,
                showOnCreate: true,
                interactive: true,
                trigger: "manual",
                placement: "bottom-start",
                animation: "fade",
              });
            },
            onUpdate: (props) => {
              component?.updateProps(props);
              const clientRect = props.clientRect;
              if (!clientRect || !popup) {
                return;
              }
              getReferenceClientRect = () => {
                const rect = clientRect();
                if (!rect) {
                  return new DOMRect(0, 0, 0, 0);
                }
                return rect;
              };
              popup.setProps({
                getReferenceClientRect,
              });
            },
            onKeyDown: (props) => {
              if (props.event.key === "Escape") {
                popup?.hide();
                return true;
              }
              if (component?.ref?.onKeyDown(props)) {
                return true;
              }
              return false;
            },
            onExit: () => {
              popup?.destroy();
              component?.destroy();
              component = null;
              popup = null;
              getReferenceClientRect = () => new DOMRect(0, 0, 0, 0);
            },
          };
        },
      } satisfies Omit<SuggestionOptions<SlashCommandItem, SlashCommandItem>, "editor">,
    };
  },
  addProseMirrorPlugins() {
    return [
      Suggestion<SlashCommandItem, SlashCommandItem>({
        editor: this.editor,
        ...this.options.suggestion,
      }),
    ];
  },
});
