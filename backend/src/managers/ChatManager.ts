import { Chat, IChat, IMessage } from '../models/Chat';
import { runChat } from '../ai/chatAgent';

export class ChatManager {
  private static instance: ChatManager;

  private constructor() {}

  static getInstance(): ChatManager {
    if (!ChatManager.instance) {
      ChatManager.instance = new ChatManager();
    }
    return ChatManager.instance;
  }

  async createChat(chatId: string, userId: string): Promise<IChat> {
    const chat = new Chat({
      chatId,
      userId,
      messages: []
    });
    return await chat.save();
  }

  async getChat(chatId: string, userId: string): Promise<IChat | null> {
    return await Chat.findOne({ chatId, userId });
  }

  async getUserChats(userId: string): Promise<IChat[]> {
    return await Chat.find({ userId }).sort({ updatedAt: -1 });
  }

  async addMessage(chatId: string, userId: string, message: Omit<IMessage, 'timestamp'>): Promise<IChat> {
    const chat = await Chat.findOneAndUpdate(
      { chatId, userId },
      {
        $push: { messages: { ...message, timestamp: new Date() } },
        $set: { updatedAt: new Date() }
      },
      { new: true, upsert: true }
    );
    return chat!;
  }

  async processAIResponse(chatId: string, userId: string, userMessage: string): Promise<string> {
    try {
      // Add user message to chat
      await this.addMessage(chatId, userId, { role: 'user', content: userMessage });

      // Get AI response
      const aiResponse = await runChat(userMessage);

      // Add AI response to chat
      await this.addMessage(chatId, userId, { role: 'assistant', content: aiResponse as string });

      return aiResponse as string;
    } catch (error) {
      console.error('Error processing AI response:', error);
      throw error;
    }
  }

  async deleteChat(chatId: string, userId: string): Promise<boolean> {
    const result = await Chat.deleteOne({ chatId, userId });
    return result.deletedCount > 0;
  }
}