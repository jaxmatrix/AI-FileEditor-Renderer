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
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    console.log('🚀 Initializing chat sidebar...');
    const socket = socketManager.connect();

    const updateConnectionStatus = () => {
      console.log('🔄 Connection status changed:', socket.connected);
      setIsConnected(socket.connected);
    };

    // Initial status
    updateConnectionStatus();

    // Listen for connection changes
    socket.on('connect', updateConnectionStatus);
    socket.on('disconnect', updateConnectionStatus);

    socketManager.joinChat(CHAT_ID);
    console.log('📝 Joined chat:', CHAT_ID);

    socketManager.onMessage((data) => {
      console.log('📨 Received message:', data);
      setIsLoading(false); // Stop loading when response arrives
      const newMessages: Message[] = [
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: data.aiResponse,
          timestamp: new Date(data.timestamp)
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
        {isLoading && (
          <div className="flex justify-start">
            <div className="max-w-[85%] rounded-lg px-3 py-2 text-sm shadow-sm bg-background text-foreground border">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="border-t px-5 py-4">
        <form
          className="flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (inputValue.trim() && isConnected && !isLoading) {
              const userMessage = inputValue.trim();
              // Add user message immediately
              const newUserMessage: Message = {
                id: `user-${Date.now()}`,
                role: "user",
                content: userMessage,
                timestamp: new Date()
              };
              setMessages(prev => [...prev, newUserMessage]);
              setInputValue("");
              setIsLoading(true); // Start loading

              // Send message to server
              socketManager.sendMessage(CHAT_ID, userMessage);
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
          <Button size="sm" type="submit" variant="outline" disabled={!isConnected || !inputValue.trim() || isLoading}>
            {isLoading ? "..." : "Send"}
          </Button>
          <Button
            size="sm"
            type="button"
            variant="ghost"
            onClick={() => {
              console.log('🧪 Testing connection...');
              if (isConnected) {
                socketManager.sendMessage(CHAT_ID, 'Hello, test message!');
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
        </form>
        <p className="mt-2 text-xs text-muted-foreground">
          {isConnected ? "Chat is ready!" : "Connecting to chat service..."}
        </p>
      </div>
    </aside>
  );
}
