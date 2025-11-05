import { ContextManager } from './ContextManager';
import { Context } from '../models/Context';
import * as fs from 'fs/promises';
import * as path from 'path';

describe('ContextManager', () => {
  let contextManager: ContextManager;

  beforeAll(() => {
    contextManager = ContextManager.getInstance();
  });

  beforeEach(async () => {
    // Re-create the directory before each test
    await fs.mkdir('contextStore', { recursive: true });
  });

  afterEach(async () => {
    await Context.deleteMany({});
    try {
      // Use fs.rm as fs.rmdir is deprecated
      await fs.rm('contextStore', { recursive: true, force: true });
    } catch (error) {}
  });

  describe('createContext', () => {
    it('should create a new context and a local file', async () => {
      const fileId = 'testFile';
      const userId = 'testUser';
      const initialContent = '# Hello World\nThis is a test file.';

      await contextManager.createContext(fileId, userId, initialContent);

      const contextInDb = await Context.findOne({ fileId, userId });
      expect(contextInDb).not.toBeNull();
      expect(contextInDb?.currentFileState).toEqual(initialContent);

      const filePath = path.join('contextStore', `${fileId}.md`);
      const fileContent = await fs.readFile(filePath, 'utf-8');
      expect(fileContent).toEqual(initialContent);
    });
  });

  describe('getContext', () => {
    it('should return a summary of the file', async () => {
      const fileId = 'testFile';
      const userId = 'testUser';
      const initialContent = '# Section 1\nLine 1\nLine 2\n# Section 2\nLine 3';
      await contextManager.createContext(fileId, userId, initialContent);

      const summary = await contextManager.getContext(fileId, userId);
      expect(summary.sections).toHaveLength(2);
      expect(summary.sections[0].header).toEqual('# Section 1');
      expect(summary.sections[0].content).toEqual('Line 1\nLine 2');
      expect(summary.sections[0].startLine).toEqual(1);
      expect(summary.sections[1].header).toEqual('# Section 2');
      expect(summary.sections[1].content).toEqual('Line 3');
      expect(summary.sections[1].startLine).toEqual(4);
    });
  });

  describe('getSection', () => {
    it('should return the content of a specific section', async () => {
      const fileId = 'testFile';
      const userId = 'testUser';
      const initialContent = '# Section 1\nLine 1\nLine 2\n# Section 2\nLine 3';
      await contextManager.createContext(fileId, userId, initialContent);

      const sectionContent = await contextManager.getSection(fileId, userId, '# Section 2');
      expect(sectionContent).toEqual('Line 3');
    });
  });

  describe('updateFile', () => {
    it('should update the file content and version history', async () => {
      const fileId = 'testFile';
      const userId = 'testUser';
      const initialContent = '# Hello World\nThis is a test file.';
      const updatedContent = '# Hello World\nThis is an updated test file.';

      await contextManager.createContext(fileId, userId, initialContent);
      await contextManager.updateFile(fileId, userId, updatedContent);

      const contextInDb = await Context.findOne({ fileId, userId });
      expect(contextInDb?.currentFileState).toEqual(updatedContent);
      expect(Object.keys(contextInDb?.history.versions || {}).length).toBe(2);

      const filePath = path.join('contextStore', `${fileId}.md`);
      const fileContent = await fs.readFile(filePath, 'utf-8');
      expect(fileContent).toEqual(updatedContent);
    });
  });

  describe('applyAIPatch', () => {
    it('should apply a patch to the file and update the version history', async () => {
      const fileId = 'testFile';
      const userId = 'testUser';
      const initialContent = 'Hello World';
      const patch = '--- a/testFile.md\n+++ b/testFile.md\n@@ -1 +1 @@\n-Hello World\n+Hello Patched World';
      const expectedContent = 'Hello Patched World';

      await contextManager.createContext(fileId, userId, initialContent);
      await contextManager.applyAIPatch(fileId, userId, patch);

      const contextInDb = await Context.findOne({ fileId, userId });
      expect(contextInDb?.currentFileState).toEqual(expectedContent);

      const filePath = path.join('contextStore', `${fileId}.md`);
      const fileContent = await fs.readFile(filePath, 'utf-8');
      expect(fileContent).toEqual(expectedContent);
    });
  });
});