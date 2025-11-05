import { io, Socket } from "socket.io-client";

const USER_ID = "test_user_awesome";

class SocketManager {
  private socket: Socket | null = null;
  private currentChatId: string | null = null;

  connect(): Socket {
    if (!this.socket) {
      console.log("🔌 Connecting to Socket.IO server...");
      this.socket = io("/", {
        transports: ["polling", "websocket"], // Try polling first, then websocket
        timeout: 5000,
        forceNew: true,
        upgrade: true,
      });

      this.socket.on("connect", () => {
        console.log("✅ Connected to server:", this.socket?.id);
      });

      this.socket.on("disconnect", () => {
        console.log("❌ Disconnected from server");
      });

      this.socket.on("connect_error", (error) => {
        console.error("🔴 Socket connection error:", error);
        // Try to reconnect after a delay
        setTimeout(() => {
          console.log("🔄 Attempting to reconnect...");
          this.socket?.connect();
        }, 2000);
      });

      this.socket.on("error", (error) => {
        console.error("🔴 Socket error:", error);
      });
    }
    return this.socket;
  }

  joinChat(chatId: string): void {
    if (this.socket && chatId !== this.currentChatId) {
      this.currentChatId = chatId;
      this.socket.emit("join-chat", chatId, USER_ID);
    }
  }

  sendMessage(chatId: string, message: string): void {
    if (this.socket) {
      this.socket.emit("send-message", {
        chatId,
        userId: USER_ID,
        message,
      });
    }
  }

  onMessage(
    callback: (data: {
      chatId: string;
      userMessage: string;
      aiResponse: string;
      timestamp: Date;
    }) => void,
  ): void {
    if (this.socket) {
      this.socket.on("message", callback);
    }
  }

  // This is to recieve new content ( get changes by the ai )
  onFileUpdate(callback: (content: string) => void) {
    if (this.socket) {
      this.socket.on("file-update", callback);
    }
  }

  onThinkingStep(callback: (step: string) => void) {
    if (this.socket) {
      this.socket.on("thinking-step", callback);
    }
  }

  createFile(fileId: string) {
    if (this.socket) {
      this.socket.emit("create-file", { fileId, userId: USER_ID });
    }
  }

  // This is to edit new content ( send changes by user)
  editContent(chatId: string, newContent: string) {
    if (this.socket) {
      this.socket.emit("edit-content", {
        chatId,
        userId: USER_ID,
        newContent,
      });
    }
  }

  onError(callback: (error: { message: string }) => void): void {
    if (this.socket) {
      this.socket.on("error", callback);
    }
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.currentChatId = null;
    }
  }

  getUserId(): string {
    return USER_ID;
  }
}

export const socketManager = new SocketManager();

