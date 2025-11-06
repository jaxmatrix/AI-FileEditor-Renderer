import React, { forwardRef, useImperativeHandle } from 'react'
import { SuggestionKeyDownProps, SuggestionProps } from '@tiptap/suggestion'

// Match the item shape used by the slash command
type SlashCommandItem = {
  title: string;
  description: string;
  keywords: string[];
  icon: React.ComponentType<{ className?: string }>;
  action: (props: { editor: any; range: Range }) => void;
}

type CommandListProps = SuggestionProps<SlashCommandItem>

export type CommandListHandle = {
  onKeyDown: (props: SuggestionKeyDownProps) => boolean
}

const CommandList = forwardRef<CommandListHandle, CommandListProps>((props, ref) => {
  useImperativeHandle(ref, () => ({
    onKeyDown: () => false,
  }))

  void props;
  return <div>Command list</div>
})

CommandList.displayName = 'CommandList'

export default CommandList
