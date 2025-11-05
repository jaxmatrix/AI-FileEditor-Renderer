import { useState, useEffect } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSocket } from "@/contexts/SocketContext";

interface Message {
  id: string;
  role: "user" | "assistant" | "updates";
  content: string;
  timestamp?: Date;
}

const CHAT_ID = "default-chat";

export function ChatSidebar() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { isConnected, userId, joinChat, onMessage, onError, sendMessage, createFile } =
    useSocket();

  useEffect(() => {
    joinChat(CHAT_ID);

    onMessage((data) => {
      setIsLoading(false);
      const newMessages: Message[] = [
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: data.aiResponse,
          timestamp: new Date(data.timestamp),
        },
      ];
      setMessages((prev) => [...prev, ...newMessages]);
    });

    onError((error) => {
      console.error("Socket error:", error);
    });
  }, [joinChat, onMessage, onError]);

  return (
    <aside className="flex h-full min-w-0 flex-col bg-muted/40">
      <div className="border-b px-5 py-4">
        <div className="flex items-center justify-between">
          <p className="text-lg font-semibold">AI Companion</p>
          <Button onClick={createFile} size="sm">
            New File
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Connected as: {userId} {isConnected ? "🟢" : "🔴"}
        </p>
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "flex",
              message.role === "assistant" ? "justify-start" : "justify-end",
            )}
          >
            <div
              className={cn(
                "max-w-[100%] rounded-lg px-3 py-2 text-sm shadow-sm",
                message.role === "assistant"
                  ? "text-foreground"
                  : "bg-primary text-primary-foreground",
              )}
            >
              {message.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="max-w-[85%] rounded-lg px-3 py-2 text-sm shadow-sm bg-background text-foreground border">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                <div
                  className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
                  style={{ animationDelay: "0.1s" }}
                ></div>
                <div
                  className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                ></div>
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="border-t px-2 py-4">
        <form
          className="flex flex-col item-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (inputValue.trim() && isConnected && !isLoading) {
              const userMessage = inputValue.trim();
              const newUserMessage: Message = {
                id: `user-${Date.now()}`,
                role: "user",
                content: userMessage,
                timestamp: new Date(),
              };
              setMessages((prev) => [...prev, newUserMessage]);
              setInputValue("");
              setIsLoading(true);

              sendMessage(CHAT_ID, userMessage);
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
          <div className="flex justify-end">
            <Button
              size="sm"
              type="submit"
              variant="outline"
              disabled={!isConnected || !inputValue.trim() || isLoading}
            >
              {isLoading ? "..." : "Send"}
            </Button>
            <Button
              size="sm"
              type="button"
              variant="ghost"
              onClick={() => {
                if (isConnected) {
                  sendMessage(CHAT_ID, "Hello, test message!");
                }
              }}
              disabled={!isConnected}
            >
              Test
            </Button>
            <Button
              size="sm"
              type="button"
              variant="ghost"
              onClick={() => setMessages([])}
              disabled={messages.length === 0}
            >
              Clear
            </Button>
          </div>
        </form>
        <p className="mt-2 text-xs text-muted-foreground">
          {isConnected ? "Chat is ready!" : "Connecting to chat service..."}
        </p>
      </div>
    </aside>
  );
}
