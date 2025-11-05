import mongoose, { Schema, Document } from 'mongoose';

export interface IMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface IChat extends Document {
  chatId: string;
  userId: string;
  fileId?: string;
  messages: IMessage[];
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>({
  role: { type: String, enum: ['user', 'assistant'], required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

const ChatSchema = new Schema<IChat>({
  chatId: { type: String, required: true, unique: true },
  userId: { type: String, required: true },
  fileId: { type: String },
  messages: [MessageSchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

ChatSchema.index({ userId: 1, chatId: 1 });

export const Chat = mongoose.model<IChat>('Chat', ChatSchema);