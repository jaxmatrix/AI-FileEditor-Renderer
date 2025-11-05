import * as path from 'path';
import { FileManager } from '../core/FileManager';
import { Patcher } from '../core/Patcher';
import { VersionControl } from '../core/VersionControl';
import { Context, IContext } from '../models/Context';
import * as fs from 'fs/promises';

export class ContextManager {
  private static instance: ContextManager;
  private fileManager: FileManager;
  private patcher: Patcher;
  private readonly contextStoreDir = 'contextStore';

  private constructor() {
    this.fileManager = new FileManager();
    this.patcher = new Patcher();
    this.initializeContextStore();
  }

  static getInstance(): ContextManager {
    if (!ContextManager.instance) {
      ContextManager.instance = new ContextManager();
    }
    return ContextManager.instance;
  }

  private async initializeContextStore() {
    try {
      await fs.mkdir(this.contextStoreDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create contextStore directory:', error);
    }
  }

  async getContext(fileId: string, userId: string): Promise<any> {
    const context = await Context.findOne({ fileId, userId });
    if (!context) {
      return null;
    }

    const content = context.currentFileState;
    const lines = content.split('\n');
    const sections = [];
    let currentSection: { header: string; lines: string[]; startLine: number } | null = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.startsWith('#')) {
        if (currentSection) {
          sections.push({
            header: currentSection.header,
            content: currentSection.lines.slice(0, 2).join('\n'),
            startLine: currentSection.startLine,
          });
        }
        currentSection = { header: line, lines: [], startLine: i + 1 };
      } else if (currentSection) {
        currentSection.lines.push(line);
      }
    }

    if (currentSection) {
      sections.push({
        header: currentSection.header,
        content: currentSection.lines.slice(0, 2).join('\n'),
        startLine: currentSection.startLine,
      });
    }

    return { sections };
  }

  async getSection(fileId: string, userId: string, sectionHeader: string): Promise<string | null> {
    const context = await Context.findOne({ fileId, userId });
    if (!context) {
      return null;
    }

    const content = context.currentFileState;
    const lines = content.split('\n');
    let inSection = false;
    const sectionLines = [];

    for (const line of lines) {
      if (line.startsWith('#')) {
        if (inSection) {
          break;
        }
        if (line.trim() === sectionHeader.trim()) {
          inSection = true;
        }
      } else if (inSection) {
        sectionLines.push(line);
      }
    }

    return sectionLines.join('\n');
  }

  async createContext(fileId: string, userId: string, initialContent: string): Promise<IContext> {
    const vc = new VersionControl(this.fileManager, this.patcher);
    await vc.initialize(initialContent);

    const history = await (vc as any).getHistoryLog();

    const newContext = new Context({
      fileId,
      userId,
      history,
      currentFileState: initialContent,
    });

    await newContext.save();

    const filePath = path.join(this.contextStoreDir, `${fileId}.md`);
    await this.fileManager.createFile(filePath, initialContent);

    return newContext;
  }
  async updateFile(fileId: string, userId: string, newContent: string): Promise<IContext | null> {
    const context = await Context.findOne({ fileId, userId });
    if (!context) {
      return null;
    }

    const vc = new VersionControl(this.fileManager, this.patcher);
    (vc as any).history = context.history;

    const patch = this.patcher.createPatch(context.currentFileState, newContent, `${fileId}.md`);
    await vc.commit(patch, 'User update');

    context.history = await (vc as any).getHistoryLog();
    context.currentFileState = newContent;
    context.updatedAt = new Date();

    await context.save();

    const filePath = path.join(this.contextStoreDir, `${fileId}.md`);
    await this.fileManager.saveFile(filePath, newContent);

    return context;
  }

  async applyAIPatch(fileId: string, userId: string, patchContent: string): Promise<IContext | null> {
    const context = await Context.findOne({ fileId, userId });
    if (!context) {
      return null;
    }

    const newContent = this.patcher.applyPatch(context.currentFileState, patchContent);
    return this.updateFile(fileId, userId, newContent);
  }
}