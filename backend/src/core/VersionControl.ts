import * as crypto from 'crypto';
import * as path from 'path';
import { FileManager } from './FileManager';
import { Patcher } from './Patcher';
import { mkdir, writeFile } from 'fs/promises';


export interface Version {
  id: string;
  parentId: string | null;
  message: string;
  patchFile: string | null;
}

export interface Branch {
  name: string;
  head: string;
}

export interface HistoryLog {
  versions: Record<string, Version>;
  branches: Record<string, Branch>;
  currentBranch: string;
}

export class VersionControl {
  private readonly metaDir = '.project_meta';
  private readonly versionsDir = path.join(this.metaDir, 'versions');
  private readonly historyFile = path.join(this.metaDir, 'history.log');
  private readonly baseFile = path.join(this.metaDir, 'base.md');

  constructor(
    private fileManager: FileManager,
    private patcher: Patcher
  ) {}

  async initialize(initialContent: string): Promise<void> {
    await mkdir(this.versionsDir, { recursive: true });
    await this.fileManager.saveFile(this.baseFile, initialContent);

    const rootVersionId = crypto.randomUUID();
    const rootVersion: Version = {
      id: rootVersionId,
      parentId: null,
      message: 'Initial commit',
      patchFile: null,
    };

    const mainBranch: Branch = {
      name: 'main',
      head: rootVersionId,
    };

    const historyLog: HistoryLog = {
      versions: { [rootVersionId]: rootVersion },
      branches: { main: mainBranch },
      currentBranch: 'main',
    };

    await this.saveHistoryLog(historyLog);
  }

  async commit(patchContent: string, message: string): Promise<void> {
    const historyLog = await this.getHistoryLog();
    const currentBranch = historyLog.branches[historyLog.currentBranch];
    const parentId = currentBranch.head;

    const newVersionId = crypto.randomUUID();
    const patchFileName = `${newVersionId}.patch`;
    const patchFilePath = path.join(this.versionsDir, patchFileName);

    await this.fileManager.saveFile(patchFilePath, patchContent);

    const newVersion: Version = {
      id: newVersionId,
      parentId,
      message,
      patchFile: patchFileName,
    };

    historyLog.versions[newVersionId] = newVersion;
    currentBranch.head = newVersionId;

    await this.saveHistoryLog(historyLog);
  }

  async checkout(versionId: string): Promise<string> {
    const historyLog = await this.getHistoryLog();
    
    let currentVersion = historyLog.versions[versionId];
    if (!currentVersion) {
      throw new Error('Version not found.');
    }

    const patchChain: Version[] = [];
    while (currentVersion) {
      patchChain.push(currentVersion);
      if (currentVersion.parentId === null) break;
      currentVersion = historyLog.versions[currentVersion.parentId];
    }
    patchChain.reverse();

    let content = await this.fileManager.openFile(this.baseFile);
    for (const version of patchChain) {
      if (version.patchFile) {
        const patchContent = await this.fileManager.openFile(path.join(this.versionsDir, version.patchFile));
        content = this.patcher.applyPatch(content, patchContent);
      }
    }
    return content;
  }

  async createBranch(branchName: string, fromVersionId: string): Promise<void> {
    const historyLog = await this.getHistoryLog();
    if (historyLog.branches[branchName]) {
      throw new Error(`Branch ${branchName} already exists.`);
    }
    if (!historyLog.versions[fromVersionId]) {
      throw new Error(`Version ${fromVersionId} not found.`);
    }

    historyLog.branches[branchName] = {
      name: branchName,
      head: fromVersionId,
    };
    await this.saveHistoryLog(historyLog);
  }
  
  async getCurrentFileContent(): Promise<string> {
    if (!(await this.fileManager.fileExists(this.historyFile))) {
        await this.initialize("Initial content");
    }
    const historyLog = await this.getHistoryLog();
    const currentBranch = historyLog.branches[historyLog.currentBranch];
    return this.checkout(currentBranch.head);
  }

  private async getHistoryLog(): Promise<HistoryLog> {
    const content = await this.fileManager.openFile(this.historyFile);
    return JSON.parse(content);
  }

  private async saveHistoryLog(log: HistoryLog): Promise<void> {
    await this.fileManager.saveFile(this.historyFile, JSON.stringify(log, null, 2));
  }
}
