import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Socket } from "socket.io-client";
import { socketManager } from "@/lib/socket";

interface SocketContextValue {
  socket: Socket | null;
  isConnected: boolean;
  userId: string;
  fileId: string | null;
  fileContent: string;
  createFile: () => void;
  joinChat: (chatId: string, fileId?: string) => void;
  sendMessage: (chatId: string, message: string) => void;
  onMessage: (
    callback: (data: {
      chatId: string;
      userMessage: string;
      aiResponse: string;
      timestamp: Date;
    }) => void,
  ) => void;
  onFileUpdate: (callback: (content: string) => void) => void;
  onThinkingStep: (callback: (step: string) => void) => void;
  editContent: (chatId: string, content: string) => void;
  onError: (callback: (error: { message: string }) => void) => void;
}

const SocketContext = createContext<SocketContextValue | undefined>(undefined);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [fileId, setFileId] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState('');

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
      fileId,
      fileContent,
      createFile: () => {
        const newFileId = crypto.randomUUID();
        setFileId(newFileId);
        setFileContent('');
        socketManager.createFile(newFileId);
      },
      joinChat: (chatId: string, fileId?: string) => {
        setFileId(fileId || null);
        socketManager.joinChat(chatId);
      },
      sendMessage: (chatId: string, message: string) =>
        socketManager.sendMessage(chatId, message),
      onMessage: (callback) => socketManager.onMessage(callback),
      onFileUpdate: (callback) => socketManager.onFileUpdate(callback),
      onThinkingStep: (callback) => socketManager.onThinkingStep(callback),
      editContent: (chatId, content) => {
        setFileContent(content);
        socketManager.editContent(chatId, content);
      },
      onError: (callback) => socketManager.onError(callback),
    }),
    [socket, isConnected, fileId, fileContent],
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
