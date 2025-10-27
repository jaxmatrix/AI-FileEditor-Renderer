import express from 'express';
import cors from 'cors';
import { FileManager } from './core/FileManager';
import { Patcher } from './core/Patcher';
import { Indexer } from './core/Indexer';
import { VersionControl } from './core/VersionControl';

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

// Service Initialization
const fileManager = new FileManager();
const patcher = new Patcher();
const indexer = new Indexer();
const vc = new VersionControl(fileManager, patcher);

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

app.listen(port, () => {
  console.log(`Backend server listening on http://localhost:${port}`);
});
