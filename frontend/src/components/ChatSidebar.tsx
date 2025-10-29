import { useState, useEffect, useMemo } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { socketManager } from "@/lib/socket";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp?: Date;
}

const CHAT_ID = "default-chat";

export function ChatSidebar() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const socket = socketManager.connect();
    setIsConnected(socket.connected);

    socketManager.joinChat(CHAT_ID);

    socketManager.onMessage((data) => {
      const newMessages: Message[] = [
        {
          id: `user-${Date.now()}`,
          role: "user",
          content: data.userMessage,
          timestamp: data.timestamp
        },
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: data.aiResponse,
          timestamp: data.timestamp
        }
      ];
      setMessages(prev => [...prev, ...newMessages]);
    });

    socketManager.onError((error) => {
      console.error("Socket error:", error);
    });

    return () => {
      socketManager.disconnect();
    };
  }, []);

  return (
    <aside className="flex h-full min-w-0 flex-col bg-muted/40">
      <div className="border-b px-5 py-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Assistant</p>
        <p className="text-lg font-semibold">AI Companion</p>
        <p className="text-xs text-muted-foreground mt-1">
          Connected as: {socketManager.getUserId()} {isConnected ? "🟢" : "🔴"}
        </p>
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
        <form
          className="flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (inputValue.trim() && isConnected) {
              socketManager.sendMessage(CHAT_ID, inputValue.trim());
              setInputValue("");
            }
          }}
        >
          <input
            type="text"
            placeholder="Ask the AI..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-ring focus:ring-offset-2"
            disabled={!isConnected}
          />
          <Button size="sm" type="submit" variant="outline" disabled={!isConnected || !inputValue.trim()}>
            Send
          </Button>
        </form>
        <p className="mt-2 text-xs text-muted-foreground">
          {isConnected ? "Chat is ready!" : "Connecting to chat service..."}
        </p>
      </div>
    </aside>
  );
}
