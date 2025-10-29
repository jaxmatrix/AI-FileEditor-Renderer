import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { FileManager } from './core/FileManager';
import { Patcher } from './core/Patcher';
import { Indexer } from './core/Indexer';
import { VersionControl } from './core/VersionControl';
import { loadCachedPrompt } from './ai/prompt/loader';
import { promptConfig } from './ai/prompt/prompt.config';
import { runPipeline } from './ai/graph';
import { ChatManager } from './managers/ChatManager';

import mongoose from 'mongoose';

const connectMongoDB = async () => {
  try {
    const uri = process.env.MONGO_URI || 'mongodb://root:example@localhost:27017/';
    await mongoose.connect(uri, {
      authSource: 'admin'
    });
    console.log('✅ Connected to MongoDB successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

connectMongoDB();
dotenv.config();

const app = express();
const port = 3001;
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// Service Initialization
const fileManager = new FileManager();
const patcher = new Patcher();
const indexer = new Indexer();
const vc = new VersionControl(fileManager, patcher);
const chatManager = ChatManager.getInstance();

// Load prompts at startup
loadCachedPrompt(promptConfig);

// API Endpoints
app.get('/api/health', (req, res) => {
  res.json({ status: 'Backend is running!' });
});

app.get('/api/document', async (req, res) => {
  try {
    const content = await vc.getCurrentFileContent();
    res.json({ content });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get document content.' });
  }
});

app.post('/api/commit', async (req, res) => {
  const { patchContent, message } = req.body;
  if (!patchContent || !message) {
    return res.status(400).json({ error: 'patchContent and message are required.' });
  }
  try {
    await vc.commit(patchContent, message);
    res.status(200).json({ message: 'Commit successful.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to commit patch.' });
  }
});

// AI chat endpoint
app.post('/api/ai/chat', async (req, res) => {
  const { message } = req.body as { message?: string };
  if (!message) {
    return res.status(400).json({ error: 'message is required' });
  }
  try {
    const response = await runPipeline(message);
    res.json({ response });
  } catch (error: any) {
    res.status(500).json({ error: error?.message ?? 'AI pipeline failed' });
  }
});

// Socket.IO setup for chat connections
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-chat', (chatId: string, userId: string) => {
    socket.join(`chat-${chatId}-${userId}`);
    console.log(`User ${userId} joined chat ${chatId}`);
  });

  socket.on('send-message', async (data: { chatId: string; userId: string; message: string }) => {
    try {
      const { chatId, userId, message } = data;

      // Process AI response and store in database
      const aiResponse = await chatManager.processAIResponse(chatId, userId, message);

      // Emit the response back to the specific chat room
      io.to(`chat-${chatId}-${userId}`).emit('message', {
        chatId,
        userMessage: message,
        aiResponse,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Error processing message:', error);
      socket.emit('error', { message: 'Failed to process message' });
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

server.listen(port, () => {
  console.log(`Backend server listening on http://localhost:${port}`);
});
