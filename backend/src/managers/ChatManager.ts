import { Chat, IChat, IMessage } from '../models/Chat';
import { runPipeline } from '../ai/graph';

export class ChatManager {
  private static instance: ChatManager;

  private constructor() {}

  static getInstance(): ChatManager {
    if (!ChatManager.instance) {
      ChatManager.instance = new ChatManager();
    }
    return ChatManager.instance;
  }

  async createChat(chatId: string, userId: string, fileId?: string): Promise<IChat> {
    const chat = new Chat({
      chatId,
      userId,
      fileId,
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
      const aiResponse = await runPipeline(userMessage);

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
  sendFileUpdate(userId: string, fileId: string, content: string) {
    // This is a placeholder for the actual WebSocket implementation.
    // In a real application, you would use a WebSocket library like Socket.IO
    // to emit an 'editFile' event to the user.
    console.log(`Sending file update to user ${userId} for file ${fileId}: ${content}`);
  }

  sendThinkingStep(userId: string, step: string) {
    // This is a placeholder for the actual WebSocket implementation.
    // In a real application, you would use a WebSocket library like Socket.IO
    // to emit a 'thinkingStep' event to the user.
    console.log(`Sending thinking step to user ${userId}: ${step}`);
  }
}