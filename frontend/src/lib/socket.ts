import { io, Socket } from 'socket.io-client';

const USER_ID = 'test_user_awesome';

class SocketManager {
  private socket: Socket | null = null;
  private currentChatId: string | null = null;

  connect(): Socket {
    if (!this.socket) {
      this.socket = io('http://localhost:3001', {
        transports: ['websocket', 'polling']
      });

      this.socket.on('connect', () => {
        console.log('Connected to server');
      });

      this.socket.on('disconnect', () => {
        console.log('Disconnected from server');
      });

      this.socket.on('error', (error) => {
        console.error('Socket error:', error);
      });
    }
    return this.socket;
  }

  joinChat(chatId: string): void {
    if (this.socket && chatId !== this.currentChatId) {
      this.currentChatId = chatId;
      this.socket.emit('join-chat', chatId, USER_ID);
    }
  }

  sendMessage(chatId: string, message: string): void {
    if (this.socket) {
      this.socket.emit('send-message', {
        chatId,
        userId: USER_ID,
        message
      });
    }
  }

  onMessage(callback: (data: {
    chatId: string;
    userMessage: string;
    aiResponse: string;
    timestamp: Date;
  }) => void): void {
    if (this.socket) {
      this.socket.on('message', callback);
    }
  }

  onError(callback: (error: { message: string }) => void): void {
    if (this.socket) {
      this.socket.on('error', callback);
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