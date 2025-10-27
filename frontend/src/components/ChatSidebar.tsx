import { useMemo } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const seedMessages = [
  {
    id: "assistant-1",
    role: "assistant" as const,
    content: "How can I support your writing today?",
  },
  {
    id: "user-1",
    role: "user" as const,
    content: "Draft an outline for the product requirements.",
  },
  {
    id: "assistant-2",
    role: "assistant" as const,
    content: "Sure. Share any context I should include.",
  },
];

export function ChatSidebar() {
  const messages = useMemo(() => seedMessages, []);

  return (
    <aside className="flex h-full min-w-0 flex-col bg-muted/40">
      <div className="border-b px-5 py-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Assistant</p>
        <p className="text-lg font-semibold">AI Companion</p>
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn("flex", message.role === "assistant" ? "justify-start" : "justify-end")}
          >
            <div
              className={cn(
                "max-w-[85%] rounded-lg px-3 py-2 text-sm shadow-sm",
                message.role === "assistant"
                  ? "bg-background text-foreground border"
                  : "bg-primary text-primary-foreground"
              )}
            >
              {message.content}
            </div>
          </div>
        ))}
      </div>
      <div className="border-t px-5 py-4">
        <form className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Ask the AI..."
            className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-ring focus:ring-offset-2"
            disabled
          />
          <Button size="sm" type="button" variant="outline" disabled>
            Send
          </Button>
        </form>
        <p className="mt-2 text-xs text-muted-foreground">
          Chat capabilities will be available soon.
        </p>
      </div>
    </aside>
  );
}
