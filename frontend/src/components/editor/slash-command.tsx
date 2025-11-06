import {
  Suggestion,
  SuggestionProps,
  SuggestionKeyDownProps,
} from '@tiptap/suggestion'
import { ReactRenderer } from '@tiptap/react'
import tippy, { Instance, Props } from 'tippy.js'
import CommandList from './Command'
import { PluginKey } from '@tiptap/pm/state'
import { Extension, Editor } from '@tiptap/core'

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

const SlashCommand = Extension.create({
  name: 'slash-command',
  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        pluginKey: new PluginKey('slash-command'),
        command: ({ editor, range, props }) => {
          props.command({ editor, range })
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
                content: component!.element,
                showOnCreate: true,
                interactive: true,
                trigger: 'manual',
                placement: 'bottom-start',
                animation: 'fade',
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
              if (props.event.key === 'Escape') {
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
      }),
    ]
  },
})

export default SlashCommand
