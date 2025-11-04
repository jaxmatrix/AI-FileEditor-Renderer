import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Socket } from "socket.io-client";
import { socketManager } from "@/lib/socket";

interface SocketContextValue {
  socket: Socket | null;
  isConnected: boolean;
  userId: string;
  joinChat: (chatId: string) => void;
  sendMessage: (chatId: string, message: string) => void;
  onMessage: (
    callback: (data: {
      chatId: string;
      userMessage: string;
      aiResponse: string;
      timestamp: Date;
    }) => void,
  ) => void;
  onContentEdit: (
    callback: (data: { chatId: string; editedContent: string }) => void,
  ) => void;
  editContent: (
    callback: (data: { chatId: string; editedContent: string }) => void,
  ) => void;
  onError: (callback: (error: { message: string }) => void) => void;
}

const SocketContext = createContext<SocketContextValue | undefined>(undefined);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const s = socketManager.connect();
    setSocket(s);

    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);

    if (s.connected) setIsConnected(true);
    s.on("connect", handleConnect);
    s.on("disconnect", handleDisconnect);

    return () => {
      s.off("connect", handleConnect);
      s.off("disconnect", handleDisconnect);
      socketManager.disconnect();
    };
  }, []);

  const value = useMemo<SocketContextValue>(
    () => ({
      socket,
      isConnected,
      userId: socketManager.getUserId(),
      joinChat: (chatId: string) => socketManager.joinChat(chatId),
      sendMessage: (chatId: string, message: string) =>
        socketManager.sendMessage(chatId, message),
      onMessage: (callback) => socketManager.onMessage(callback),
      onContentEdit: (callback) => socketManager.onContentEdit(callback),
      editContent: (callback) => socketManager.onContentEdit(callback),
      onError: (callback) => socketManager.onError(callback),
    }),
    [socket, isConnected],
  );

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
}

export function useSocket() {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error("useSocket must be used within a SocketProvider");
  return ctx;
}
